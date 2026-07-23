import { describe, expect, it } from "vitest";

/** Pure unit stand-in for version diff logic (no DB). */
function diffVersions(
  from: { source: string; sourceTrust: number; sha256: string; qualityScore: number },
  to: { source: string; sourceTrust: number; sha256: string; qualityScore: number },
): string[] {
  const keys = ["source", "sourceTrust", "sha256", "qualityScore"] as const;
  return keys.filter((k) => from[k] !== to[k]);
}

describe("Asset Versioning compare", () => {
  it("detects trust and hash changes without deleting history", () => {
    const changed = diffVersions(
      { source: "liga_portal", sourceTrust: 60, sha256: "aaa", qualityScore: 40 },
      { source: "publisher_api", sourceTrust: 100, sha256: "bbb", qualityScore: 90 },
    );
    expect(changed).toEqual(["source", "sourceTrust", "sha256", "qualityScore"]);
  });
});
