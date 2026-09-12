import type { Evidence, ExternalEvaluation, FindingStatus } from "./contracts.js";
import type { LoadedBundle } from "./evidence.js";
import { compareCodePoint } from "./canonical.js";
import { validateSchema } from "./schema.js";
import { sanitizeText } from "./security/sanitize.js";

interface AfdocsCheck {
  id: string;
  category: string;
  status: "pass" | "warn" | "fail" | "skip";
  message: string;
}

interface Afdocs0187 {
  source: "afdocs";
  sourceVersion: "0.18.7";
  sourceUrl: string;
  measuredAt: string;
  overallScore: number;
  grade: string;
  checks: AfdocsCheck[];
}

function normalizedStatus(status: AfdocsCheck["status"]): FindingStatus {
  switch (status) {
    case "pass":
      return "PASS";
    case "warn":
      return "WARN";
    case "fail":
      return "FAIL";
    case "skip":
      return "SKIP";
  }
}

function unavailable(evidence: Evidence, reason: string, version = "unknown"): ExternalEvaluation {
  return {
    producer: "afdocs",
    evaluator_version: version,
    adapter_version: "1.0.0",
    acquisition: "IMPORTED",
    authenticity: evidence.properties.authenticity,
    evidence_ref: { evidence_id: evidence.id, sha256: evidence.content.sha256 },
    status: "UNAVAILABLE",
    reason: sanitizeText(reason),
  };
}

export async function importRecordedAfdocs(bundle: LoadedBundle): Promise<ExternalEvaluation[]> {
  const results: ExternalEvaluation[] = [];
  for (const evidence of bundle.manifest.evidence.filter(
    (item) =>
      item.target.kind === "EXTERNAL_EVALUATION" &&
      item.acquisition.kind === "IMPORTED" &&
      item.acquisition.producer === "afdocs",
  )) {
    const bytes = bundle.blobs.get(evidence.id);
    if (!bytes) {
      results.push(unavailable(evidence, "Recorded AFDocs bytes are missing"));
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
    } catch {
      results.push(unavailable(evidence, "Recorded AFDocs JSON is malformed"));
      continue;
    }
    const sourceVersion =
      typeof parsed === "object" &&
      parsed !== null &&
      "sourceVersion" in parsed &&
      typeof parsed.sourceVersion === "string"
        ? parsed.sourceVersion
        : "unknown";
    if (sourceVersion !== "0.18.7") {
      results.push(
        unavailable(evidence, `Unsupported AFDocs 0.x version: ${sourceVersion}`, sourceVersion),
      );
      continue;
    }
    try {
      await validateSchema("afdocs-0.18.7", parsed);
    } catch (error) {
      results.push(
        unavailable(
          evidence,
          error instanceof Error ? error.message : "Recorded AFDocs result is invalid",
          sourceVersion,
        ),
      );
      continue;
    }
    const report = parsed as Afdocs0187;
    results.push({
      producer: "afdocs",
      evaluator_version: report.sourceVersion,
      adapter_version: "1.0.0",
      acquisition: "IMPORTED",
      authenticity: evidence.properties.authenticity,
      evidence_ref: { evidence_id: evidence.id, sha256: evidence.content.sha256 },
      status: "AVAILABLE",
      target: sanitizeText(report.sourceUrl),
      measured_at: report.measuredAt,
      raw_score: report.overallScore,
      raw_grade: sanitizeText(report.grade),
      checks: report.checks
        .map((check) => ({
          id: sanitizeText(check.id),
          category: sanitizeText(check.category),
          raw_status: check.status,
          normalized_status: normalizedStatus(check.status),
          message: sanitizeText(check.message),
        }))
        .sort((left, right) => compareCodePoint(left.id, right.id)),
    });
  }
  return results.sort((left, right) =>
    compareCodePoint(left.evidence_ref.evidence_id, right.evidence_ref.evidence_id),
  );
}
