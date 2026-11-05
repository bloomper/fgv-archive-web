import { describe, expect, it } from "vitest";
import { linkify } from "@/lib/linkify";

describe("linkify", () => {
  it("keeps text without links as one part", () => {
    expect(linkify("Boka RunAn")).toEqual([{ kind: "text", text: "Boka RunAn" }]);
  });

  it("finds http and https links between text", () => {
    expect(linkify("Se https://example.org/a?b=1 och http://x.test.")).toEqual([
      { kind: "text", text: "Se " },
      { kind: "link", text: "https://example.org/a?b=1", href: "https://example.org/a?b=1" },
      { kind: "text", text: " och " },
      { kind: "link", text: "http://x.test", href: "http://x.test" },
      { kind: "text", text: "." },
    ]);
  });

  it("never links other schemes", () => {
    expect(linkify("javascript:alert(1) mailto:a@b.c")).toEqual([{
      kind: "text",
      text: "javascript:alert(1) mailto:a@b.c",
    }]);
  });
});
