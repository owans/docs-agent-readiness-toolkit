import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDocuments = [
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "ROADMAP.md",
  "SECURITY.md",
  "SUPPORT.md",
  ".github/pull_request_template.md",
];

const privateDocument = "docs/agent-readiness/agent-readiness-competitive-landscape.md";

async function publicMarkdownFiles(): Promise<string[]> {
  const docs = await readdir(path.join(process.cwd(), "docs"), {
    recursive: true,
    withFileTypes: true,
  });
  return [
    ...rootDocuments,
    ...docs
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => path.relative(process.cwd(), path.join(entry.parentPath, entry.name)))
      .filter((entry) => entry !== privateDocument),
  ].sort();
}

function localLinkTargets(markdown: string): string[] {
  const targets: string[] = [];
  const pattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu;
  for (const match of markdown.matchAll(pattern)) {
    const target = match[1];
    if (
      target &&
      !target.startsWith("#") &&
      !target.startsWith("http://") &&
      !target.startsWith("https://") &&
      !target.startsWith("mailto:")
    ) {
      targets.push(decodeURIComponent(target.split("#", 1)[0] ?? ""));
    }
  }
  return targets.filter(Boolean);
}

describe("public documentation links", () => {
  it("resolves every local Markdown target", async () => {
    for (const relativePath of await publicMarkdownFiles()) {
      const markdown = await readFile(path.join(process.cwd(), relativePath), "utf8");
      for (const target of localLinkTargets(markdown)) {
        const resolved = path.resolve(process.cwd(), path.dirname(relativePath), target);
        await expect(
          stat(resolved),
          `${relativePath} links to missing local target ${target}`,
        ).resolves.toBeDefined();
      }
    }
  });
});
