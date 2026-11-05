import { describe, expect, it } from "vitest";
import { fileHref, formatBytes, spexName, versionHref, versionPartsZipHref } from "@/utils/links";

describe("links", () => {
  it("opens files in the app or under a share link, at a page", () => {
    expect(fileHref("f")).toBe("/files/f");
    expect(fileHref("f", {}, 3)).toBe("/files/f?page=3");
    expect(fileHref("f", { share: "tok" }, 1)).toBe("/share/tok/files/f");
  });

  it("finds a version in its parent's page", () => {
    expect(versionHref({ id: "v", kind: "ARRANGEMENT", parentId: "a" })).toBe("/arrangements/a#version-v");
    expect(versionHref({ id: "v", kind: "MANUSCRIPT", parentId: "m" })).toBe("/manuscripts/m#version-v");
  });

  it("builds zip addresses", () => {
    expect(versionPartsZipHref("v", "")).toBe("/api/versions/v/parts/zip");
    expect(versionPartsZipHref("v", "transpositions=C", { share: "t" })).toBe("/api/share/t/versions/v/parts/zip?transpositions=C");
  });

  it("names spex and sizes", () => {
    expect(spexName({ title: "Ali Baba", year: 2028 })).toBe("Ali Baba 2028");
    expect(spexName(null)).toBe("");
    expect(formatBytes(1_500_000, "en")).toBe("1.5 MB");
    expect(formatBytes(1_500_000, "sv")).toBe("1,5 MB");
    expect(formatBytes(512, "sv")).toBe("512 B");
  });
});
