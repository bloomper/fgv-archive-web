import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/stats/script.js/route";

vi.mock("next/server", async importOriginal => ({ ...await importOriginal<object>(), connection: vi.fn() }));

describe("GET /stats/script.js", () => {
  beforeEach(() => {
    vi.stubEnv("UMAMI_URL", "http://umami-server:3000/");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serves Umami's tracker from this origin, cached for an hour", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("(()=>{})()", { status: 200 }));

    vi.stubGlobal("fetch", fetch);

    const response = await GET();

    expect(fetch).toHaveBeenCalledWith("http://umami-server:3000/script.js", { cache: "no-store" });
    expect(response.headers.get("content-type")).toContain("javascript");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(await response.text()).toBe("(()=>{})()");
  });

  it("is not found without Umami and a bad gateway when Umami fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 500 })).mockRejectedValueOnce(new Error("down")));

    expect((await GET()).status).toBe(502);
    expect((await GET()).status).toBe(502);

    vi.stubEnv("UMAMI_URL", "");
    expect((await GET()).status).toBe(404);
  });
});
