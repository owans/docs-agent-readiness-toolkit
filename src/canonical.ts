import { createHash } from "node:crypto";
import { canonicalize } from "json-canonicalize";

export function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Text(value: string): string {
  return sha256Bytes(Buffer.from(value, "utf8"));
}

export function canonicalJson(value: unknown): string {
  return `${canonicalize(value)}\n`;
}

export function digestCanonical(value: unknown): string {
  return sha256Text(canonicalize(value));
}

export function compareCodePoint(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function derivedId(value: Record<string, unknown>, idField: string): string {
  const withoutId = { ...value };
  delete withoutId[idField];
  return `sha256:${digestCanonical(withoutId)}`;
}

export function withDerivedId<T extends Record<string, unknown>>(
  value: T,
  idField: string,
): T & Record<string, string> {
  const withoutId = { ...value };
  delete withoutId[idField];
  return {
    ...withoutId,
    [idField]: derivedId(value, idField),
  } as T & Record<string, string>;
}
