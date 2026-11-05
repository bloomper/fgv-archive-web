import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ID, sameOrigin, streamFromApi } from "@/lib/http/proxy.server";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api.server", () => ({ apiFetch }));

const request = (headers: Record<string, string> = {}) => new NextRequest("http://archive.test/api/x", { headers });

describe("sameOrigin", () => {
  it("accepts a request without Origin, or from the same host", () => {
    expect(sameOrigin(request())).toBe(true);
    expect(sameOrigin(request({ origin: "https://archive.test", host: "archive.test" }))).toBe(true);
    expect(sameOrigin(request({
      origin: "https://archive.test",
      "x-forwarded-host": "archive.test, proxy",
      host: "internal",
    }))).toBe(true);
  });

  it("refuses another site, a sibling subdomain and a malformed origin", () => {
    expect(sameOrigin(request({ origin: "https://evil.test", host: "archive.test" }))).toBe(false);
    expect(sameOrigin(request({ origin: "https://register.archive.test", host: "archive.test" }))).toBe(false);
    expect(sameOrigin(request({ origin: "not a url", host: "archive.test" }))).toBe(false);
  });
});

describe("ID", () => {
  it("takes uuids only", () => {
    expect(ID.test("01933f2a-7c3e-7b1a-9d2e-4f5a6b7c8d9e")).toBe(true);
    expect(ID.test("01933F2A-7C3E-7B1A-9D2E-4F5A6B7C8D9E")).toBe(true);
    expect(ID.test("123")).toBe(false);
    expect(ID.test("01933f2a-7c3e-7b1a-9d2e-4f5a6b7c8d9e;drop")).toBe(false);
    expect(ID.test("../01933f2a-7c3e-7b1a-9d2e-4f5a6b7c8d9e")).toBe(false);
  });
});

describe("streamFromApi", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("passes the range to the server and its partial answer back, without other headers", async () => {
    apiFetch.mockResolvedValue(new Response(new Uint8Array([1, 2]), {
      status: 206,
      headers: {
        "content-type": "application/pdf",
        "content-range": "bytes 0-1/10",
        "set-cookie": "x=1",
        "accept-ranges": "bytes",
      },
    }));

    const response = await streamFromApi(request({ range: "bytes=0-1" }), "/api/files/1");

    expect(apiFetch.mock.calls[0][2]).toBe(false);
    expect(apiFetch.mock.calls[0][1].headers.get("Range")).toBe("bytes=0-1");
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-1/10");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("keeps headers the route sets over the server's", async () => {
    apiFetch.mockResolvedValue(new Response("x", { headers: { "content-type": "image/png" } }));

    const response = await streamFromApi(request(), "/api/files/1/preview", { extra: { "Content-Type": "image/jpeg" } });

    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });

  it("hides a server error body that is not JSON and keeps its status", async () => {
    apiFetch.mockResolvedValue(new Response("internal detail", { status: 404 }));

    const response = await streamFromApi(request(), "/api/files/1");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: "NOT_AVAILABLE", message: "Not available" });
  });

  it("passes on who made an expired share link, without a token", async () => {
    apiFetch.mockResolvedValue(Response.json({ code: "SHARE_LINK_EXPIRED", message: "Utgången", createdByName: "Erik", detail: "x" },
      { status: 410 }));

    const response = await streamFromApi(request(), "/api/share/t/files/1", { anonymous: true });

    expect(apiFetch.mock.calls[0][2]).toBe(true);
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ code: "SHARE_LINK_EXPIRED", message: "Utgången", createdByName: "Erik" });
  });
});
