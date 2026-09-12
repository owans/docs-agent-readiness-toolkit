import { constants } from "node:fs";
import { type FileHandle, lstat, open, realpath, stat } from "node:fs/promises";
import path from "node:path";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_ITEMS = 1000;

export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSecurityError";
  }
}

export function normalizeRelativePath(value: string): string {
  if (value.includes("\0") || value.includes("\\") || path.isAbsolute(value)) {
    throw new PathSecurityError(`Unsafe relative path: ${JSON.stringify(value)}`);
  }
  const normalized = path.posix.normalize(value.normalize("NFC"));
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/")
  ) {
    throw new PathSecurityError(`Path escapes its root: ${JSON.stringify(value)}`);
  }
  return normalized;
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function resolveSafeFile(rootPath: string, relativePath: string): Promise<string> {
  const normalized = normalizeRelativePath(relativePath);
  const root = await realpath(rootPath);
  const rootStat = await lstat(rootPath);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new PathSecurityError(`Evidence root must be a real directory: ${rootPath}`);
  }

  let cursor = root;
  for (const segment of normalized.split("/")) {
    cursor = path.join(cursor, segment);
    const segmentStat = await lstat(cursor);
    if (segmentStat.isSymbolicLink()) {
      throw new PathSecurityError(`Symlinks are not allowed in evidence paths: ${relativePath}`);
    }
  }

  const resolved = await realpath(cursor);
  if (!isWithin(root, resolved)) {
    throw new PathSecurityError(`Evidence path escapes root: ${relativePath}`);
  }
  const stat = await lstat(resolved);
  if (!stat.isFile()) {
    throw new PathSecurityError(`Evidence input must be a regular file: ${relativePath}`);
  }
  if (stat.size > MAX_FILE_BYTES) {
    throw new PathSecurityError(`Evidence input exceeds ${MAX_FILE_BYTES} bytes: ${relativePath}`);
  }
  return resolved;
}

export async function readSafeFile(rootPath: string, relativePath: string): Promise<Buffer> {
  const resolved = await resolveSafeFile(rootPath, relativePath);
  const root = await realpath(rootPath);
  const handle = await open(resolved, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const openedStat = await handle.stat();
    if (!openedStat.isFile() || openedStat.size > MAX_FILE_BYTES) {
      throw new PathSecurityError(`Evidence input is not a bounded regular file: ${relativePath}`);
    }
    const bytes = await readOpenedFile(handle, MAX_FILE_BYTES);
    const currentResolved = await realpath(resolved);
    const currentStat = await stat(currentResolved);
    if (
      !isWithin(root, currentResolved) ||
      currentStat.dev !== openedStat.dev ||
      currentStat.ino !== openedStat.ino
    ) {
      throw new PathSecurityError(`Evidence path changed during read: ${relativePath}`);
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

async function readOpenedFile(handle: FileHandle, maxBytes: number): Promise<Buffer> {
  const buffer = Buffer.allocUnsafe(maxBytes + 1);
  let offset = 0;
  while (offset <= maxBytes) {
    const { bytesRead } = await handle.read(buffer, offset, maxBytes + 1 - offset, offset);
    if (bytesRead === 0) {
      return buffer.subarray(0, offset);
    }
    offset += bytesRead;
  }
  throw new PathSecurityError(`Input exceeds ${maxBytes} bytes`);
}

export async function readBoundedFile(filePath: string, maxBytes: number): Promise<Buffer> {
  const handle = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const openedStat = await handle.stat();
    if (!openedStat.isFile() || openedStat.size > maxBytes) {
      throw new PathSecurityError(`Input is not a regular file within ${maxBytes} bytes`);
    }
    return await readOpenedFile(handle, maxBytes);
  } finally {
    await handle.close();
  }
}

export async function assertSafeOutputRoot(
  outputPath: string,
  evidenceRoots: string[],
): Promise<string> {
  const requested = path.resolve(outputPath);
  const suffix: string[] = [];
  let ancestor = requested;
  let resolvedAncestor: string;
  while (true) {
    try {
      resolvedAncestor = await realpath(ancestor);
      break;
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
      const parent = path.dirname(ancestor);
      if (parent === ancestor) {
        throw new PathSecurityError(`Cannot resolve output root: ${outputPath}`);
      }
      suffix.unshift(path.basename(ancestor));
      ancestor = parent;
    }
  }
  const output = path.join(resolvedAncestor, ...suffix);
  for (const rootPath of evidenceRoots) {
    const root = await realpath(rootPath);
    if (isWithin(root, output) || isWithin(output, root)) {
      throw new PathSecurityError(`Output root must not contain or be inside an evidence root`);
    }
  }
  return output;
}
