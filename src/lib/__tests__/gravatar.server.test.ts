import { afterEach, describe, expect, it, vi } from "vitest";
import { gravatarImageUrl, resolveGravatarImage } from "@/lib/gravatar.server";

describe("Gravatar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hashes the trimmed, lower-cased address and asks for 404 instead of a default", () => {
    const url = gravatarImageUrl("  Anna@Example.org ");

    expect(url).toBe(gravatarImageUrl("anna@example.org"));
    expect(url).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[0-9a-f]{64}\?d=404&s=128$/);
    expect(gravatarImageUrl(" ")).toBeUndefined();
    expect(gravatarImageUrl(null)).toBeUndefined();
  });

  it("uses the image only when Gravatar has one, and gives up quietly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockRejectedValueOnce(new Error("timeout")));

    expect(await resolveGravatarImage("anna@example.org")).toBe(gravatarImageUrl("anna@example.org"));
    expect(await resolveGravatarImage("anna@example.org")).toBeUndefined();
    expect(await resolveGravatarImage("anna@example.org")).toBeUndefined();
    expect(await resolveGravatarImage(undefined)).toBeUndefined();
  });
});
