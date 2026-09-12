import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";

async function yamlFiles(): Promise<string[]> {
  const github = await readdir(path.join(process.cwd(), ".github"), {
    recursive: true,
    withFileTypes: true,
  });
  return [
    "CITATION.cff",
    ...github
      .filter(
        (entry) => entry.isFile() && (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")),
      )
      .map((entry) => path.relative(process.cwd(), path.join(entry.parentPath, entry.name))),
  ].sort();
}

describe("public YAML configuration", () => {
  it("parses without YAML syntax errors", async () => {
    for (const relativePath of await yamlFiles()) {
      const source = await readFile(path.join(process.cwd(), relativePath), "utf8");
      const document = parseDocument(source);
      expect(document.errors, `${relativePath} contains invalid YAML`).toEqual([]);
    }
  });
});
