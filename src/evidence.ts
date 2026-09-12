import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, compareCodePoint, digestCanonical, sha256Bytes } from "./canonical.js";
import type {
  CollectorConfiguration,
  Evidence,
  EvidenceBundleManifest,
  EvidenceProperties,
  TrustedValue,
} from "./contracts.js";
import { validateSchema } from "./schema.js";
import {
  assertSafeOutputRoot,
  MAX_EVIDENCE_ITEMS,
  MAX_FILE_BYTES,
  normalizeRelativePath,
  PathSecurityError,
  readBoundedFile,
  readSafeFile,
} from "./security/paths.js";
import { sanitizeText } from "./security/sanitize.js";

const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;

export class CollectorConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollectorConfigurationError";
  }
}

export interface LoadedBundle {
  root: string;
  manifest: EvidenceBundleManifest;
  bundleId: string;
  blobs: Map<string, Uint8Array>;
}

function freshness(
  observedAt?: TrustedValue,
  generatedAt?: TrustedValue,
): EvidenceProperties["freshness"] {
  return {
    status: observedAt || generatedAt ? "KNOWN" : "UNKNOWN",
    ...(observedAt ? { observed_at: observedAt } : {}),
    ...(generatedAt ? { generated_at: generatedAt } : {}),
  };
}

function provenanceStatus(input: CollectorConfiguration["inputs"][number]): "PRESENT" | "PARTIAL" {
  if (
    input.provenance?.source ||
    input.provenance?.deployment_id ||
    input.acquisition.collector ||
    input.acquisition.producer
  ) {
    return "PRESENT";
  }
  return "PARTIAL";
}

function validateInputSemantics(config: CollectorConfiguration): void {
  if (config.inputs.length > MAX_EVIDENCE_ITEMS) {
    throw new PathSecurityError(`Evidence item count exceeds ${MAX_EVIDENCE_ITEMS}`);
  }
  const ids = new Set<string>();
  const normalizedInputs = new Set<string>();
  for (const input of config.inputs) {
    if (ids.has(input.id)) {
      throw new PathSecurityError(`Duplicate evidence id: ${input.id}`);
    }
    ids.add(input.id);
    const normalized = normalizeRelativePath(input.path);
    const pathIdentity = `${input.root}:${normalized}`;
    if (normalizedInputs.has(pathIdentity)) {
      throw new PathSecurityError(`Normalized input collision: ${pathIdentity}`);
    }
    normalizedInputs.add(pathIdentity);
    for (const identityPart of [
      input.target.identity,
      input.target.locale ?? "",
      input.target.version ?? "",
    ]) {
      if (sanitizeText(identityPart) !== identityPart || /[\r\n\t]/u.test(identityPart)) {
        throw new PathSecurityError(`Target identity contains unsafe characters: ${input.id}`);
      }
    }

    if (
      (input.root === "SOURCE" || input.root === "BUILD") &&
      input.acquisition.kind !== "COLLECTED"
    ) {
      throw new PathSecurityError(`${input.root} filesystem inputs must be COLLECTED`);
    }
    if (input.root === "IMPORT" && input.acquisition.kind === "COLLECTED") {
      throw new PathSecurityError(`IMPORT inputs cannot claim COLLECTED acquisition`);
    }
    if (
      (input.root === "SOURCE" && input.mode !== "SOURCE") ||
      (input.root === "BUILD" && input.mode !== "BUILD") ||
      (input.root === "IMPORT" && (input.mode === "SOURCE" || input.mode === "BUILD"))
    ) {
      throw new PathSecurityError(`Evidence root and mode are incompatible: ${input.id}`);
    }
    if (
      (input.mode === "SOURCE" && input.target.kind !== "DOCUMENT") ||
      (input.mode === "BUILD" && input.target.kind !== "ARTIFACT") ||
      (input.target.kind === "EXTERNAL_EVALUATION" && input.root !== "IMPORT")
    ) {
      throw new PathSecurityError(`Evidence mode and target are incompatible: ${input.id}`);
    }
    const provenanceTrust = [
      input.provenance?.source?.trust,
      input.provenance?.deployment_id?.trust,
      input.provenance?.observed_at?.trust,
      input.provenance?.generated_at?.trust,
    ];
    if (
      input.acquisition.kind === "ATTESTED" ||
      input.provenance?.authenticity === "ATTESTED" ||
      provenanceTrust.includes("EXTERNALLY_ATTESTED")
    ) {
      throw new PathSecurityError(
        `Attestation verification is not implemented; evidence cannot self-assert attestation`,
      );
    }
    if (!config.roots[input.root]) {
      throw new PathSecurityError(`Missing configured root: ${input.root}`);
    }
  }
  const mappingIds = new Set<string>();
  for (const mapping of config.mappings) {
    if (mappingIds.has(mapping.id)) {
      throw new PathSecurityError(`Duplicate mapping id: ${mapping.id}`);
    }
    if (mapping.declared_trust !== "USER_ASSERTED") {
      throw new PathSecurityError(
        `Prototype mappings are caller assertions; stronger trust is unsupported`,
      );
    }
    mappingIds.add(mapping.id);
  }
}

function validateManifestSemantics(manifest: EvidenceBundleManifest): void {
  const evidenceIds = new Set<string>();
  const mappingIds = new Set<string>();
  for (const evidence of manifest.evidence) {
    if (evidenceIds.has(evidence.id)) {
      throw new PathSecurityError(`Duplicate evidence id: ${evidence.id}`);
    }
    evidenceIds.add(evidence.id);
    if (
      evidence.content.blob !== `blobs/${evidence.content.sha256}` ||
      evidence.properties.integrity.digest !== evidence.content.sha256
    ) {
      throw new PathSecurityError(`Inconsistent integrity metadata: ${evidence.id}`);
    }
    const evidenceTrust = [
      evidence.provenance.source?.trust,
      evidence.provenance.deployment_id?.trust,
      evidence.properties.freshness.observed_at?.trust,
      evidence.properties.freshness.generated_at?.trust,
    ];
    if (
      evidence.acquisition.kind === "ATTESTED" ||
      evidence.properties.authenticity === "ATTESTED" ||
      evidenceTrust.includes("EXTERNALLY_ATTESTED")
    ) {
      throw new PathSecurityError(`Attested evidence requires an unsupported verifier`);
    }
    for (const identityPart of [
      evidence.target.identity,
      evidence.target.locale ?? "",
      evidence.target.version ?? "",
    ]) {
      if (sanitizeText(identityPart) !== identityPart || /[\r\n\t]/u.test(identityPart)) {
        throw new PathSecurityError(`Unsafe target identity: ${evidence.id}`);
      }
    }
  }
  for (const mapping of manifest.mappings) {
    if (mappingIds.has(mapping.id)) {
      throw new PathSecurityError(`Duplicate mapping id: ${mapping.id}`);
    }
    if (mapping.declared_trust !== "USER_ASSERTED") {
      throw new PathSecurityError(`Loaded mappings cannot self-assert stronger trust`);
    }
    mappingIds.add(mapping.id);
  }
  const byId = new Map(manifest.evidence.map((evidence) => [evidence.id, evidence]));
  for (const mapping of manifest.mappings) {
    const from = byId.get(mapping.from);
    const to = byId.get(mapping.to);
    if (
      mapping.relation === "SOURCE_TO_BUILD" &&
      ((from && from.mode !== "SOURCE") || (to && to.mode !== "BUILD"))
    ) {
      throw new PathSecurityError(`SOURCE_TO_BUILD mapping has incompatible endpoints`);
    }
    if (
      mapping.relation === "BUILD_TO_EXPECTED_LIVE" &&
      ((from && from.mode !== "BUILD") || (to && to.mode !== "LIVE"))
    ) {
      throw new PathSecurityError(`BUILD_TO_EXPECTED_LIVE mapping has incompatible endpoints`);
    }
  }
}

export async function readCollectorConfiguration(
  configurationPath: string,
): Promise<CollectorConfiguration> {
  const bytes = await readBoundedFile(configurationPath, MAX_MANIFEST_BYTES);
  try {
    const value = JSON.parse(bytes.toString("utf8")) as unknown;
    await validateSchema("collector-configuration", value);
    const config = value as CollectorConfiguration;
    validateInputSemantics(config);
    return config;
  } catch (error) {
    throw new CollectorConfigurationError(
      error instanceof Error ? error.message : "Collector configuration is invalid",
    );
  }
}

export async function collectEvidenceBundle(
  configurationPath: string,
  outputPath: string,
): Promise<{ bundleId: string; manifest: EvidenceBundleManifest }> {
  const config = await readCollectorConfiguration(configurationPath);
  const base = path.dirname(path.resolve(configurationPath));
  const roots = Object.fromEntries(
    Object.entries(config.roots).map(([key, value]) => [key, path.resolve(base, value)]),
  ) as Partial<Record<"SOURCE" | "BUILD" | "IMPORT", string>>;
  const output = await assertSafeOutputRoot(outputPath, Object.values(roots));

  try {
    await stat(output);
    throw new PathSecurityError(`Refusing to overwrite existing output: ${output}`);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  const evidence: Evidence[] = [];
  const blobs = new Map<string, Uint8Array>();
  for (const input of config.inputs) {
    const root = roots[input.root];
    if (!root) {
      throw new PathSecurityError(`Missing root for ${input.root}`);
    }
    const bytes = await readSafeFile(root, input.path);
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new PathSecurityError(`Evidence input is too large: ${input.path}`);
    }
    const digest = sha256Bytes(bytes);
    blobs.set(digest, bytes);
    const observedSource: TrustedValue = {
      value: `${input.root}:${normalizeRelativePath(input.path)}`,
      trust: "OBSERVED_BY_COLLECTOR",
    };
    const source = input.provenance?.source ?? observedSource;
    evidence.push({
      id: input.id,
      mode: input.mode,
      acquisition: input.acquisition,
      target: input.target,
      content: {
        blob: `blobs/${digest}`,
        sha256: digest,
        bytes: bytes.byteLength,
        media_type: input.media_type,
      },
      provenance: {
        source,
        ...(input.provenance?.deployment_id
          ? { deployment_id: input.provenance.deployment_id }
          : {}),
      },
      properties: {
        integrity: { algorithm: "sha256", digest, status: "MATCHED" },
        provenance: provenanceStatus(input),
        authenticity: input.provenance?.authenticity ?? "UNVERIFIED",
        freshness: freshness(input.provenance?.observed_at, input.provenance?.generated_at),
      },
    });
  }

  const manifest: EvidenceBundleManifest = {
    schema_version: "1.0",
    bundle_version: "1.0",
    requested_modes: [...config.requested_modes].sort(compareCodePoint),
    requested_external: config.requested_external ?? false,
    evidence: evidence.sort((left, right) => compareCodePoint(left.id, right.id)),
    mappings: [...config.mappings].sort((left, right) => compareCodePoint(left.id, right.id)),
  };
  validateManifestSemantics(manifest);
  await validateSchema("evidence-bundle", manifest);
  await mkdir(path.join(output, "blobs"), { recursive: true });
  for (const [digest, bytes] of [...blobs.entries()].sort(([left], [right]) =>
    compareCodePoint(left, right),
  )) {
    await writeFile(path.join(output, "blobs", digest), bytes, { flag: "wx" });
  }
  await writeFile(path.join(output, "bundle.json"), canonicalJson(manifest), {
    encoding: "utf8",
    flag: "wx",
  });
  return { bundleId: `sha256:${digestCanonical(manifest)}`, manifest };
}

export async function loadEvidenceBundle(bundlePath: string): Promise<LoadedBundle> {
  const root = path.resolve(bundlePath);
  const rootEntries = await readdir(root, { withFileTypes: true });
  const allowedRootEntries = new Set(["bundle.json", "blobs"]);
  for (const entry of rootEntries) {
    if (!allowedRootEntries.has(entry.name) || entry.isSymbolicLink()) {
      throw new PathSecurityError(`Undeclared or unsafe bundle entry: ${entry.name}`);
    }
  }

  const manifestBytes = await readSafeFile(root, "bundle.json");
  if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) {
    throw new PathSecurityError("Evidence bundle manifest is too large");
  }
  const parsed = JSON.parse(manifestBytes.toString("utf8")) as unknown;
  await validateSchema("evidence-bundle", parsed);
  const manifest = parsed as EvidenceBundleManifest;
  validateManifestSemantics(manifest);

  const expectedBlobs = new Set(manifest.evidence.map((item) => item.content.sha256));
  const blobEntries = await readdir(path.join(root, "blobs"), { withFileTypes: true });
  for (const entry of blobEntries) {
    if (entry.isSymbolicLink() || !entry.isFile() || !expectedBlobs.has(entry.name)) {
      throw new PathSecurityError(`Undeclared or unsafe blob: ${entry.name}`);
    }
  }
  if (blobEntries.length !== expectedBlobs.size) {
    throw new PathSecurityError("Bundle blob inventory does not match the manifest");
  }

  const blobs = new Map<string, Uint8Array>();
  for (const evidence of manifest.evidence) {
    const bytes = await readSafeFile(root, evidence.content.blob);
    const digest = sha256Bytes(bytes);
    if (digest !== evidence.content.sha256 || bytes.byteLength !== evidence.content.bytes) {
      throw new PathSecurityError(`Integrity mismatch for evidence: ${evidence.id}`);
    }
    blobs.set(evidence.id, bytes);
  }

  return {
    root,
    manifest,
    bundleId: `sha256:${digestCanonical(manifest)}`,
    blobs,
  };
}
