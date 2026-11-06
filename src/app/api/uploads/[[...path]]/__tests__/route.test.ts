import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { HEAD, OPTIONS, PATCH, POST } from "@/app/api/uploads/[[...path]]/route";

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api.server", () => ({ apiFetch }));

const ID = "8f14e45f-ceea-467f-a0e6-1b2c3d4e5f60";
const params = (path?: string[]) => ({ params: Promise.resolve({ path }) });
const request = (method: string, url: string, headers: Record<string, string> = {}, body?: BodyInit) =>
  new NextRequest(`http://spexify.test${url}`, {
    method,
    headers: { host: "spexify.test", ...headers },
    body,
    duplex: "half",
  } as NextRequestInit);

describe("the tus upload proxy", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("creates an upload with only tus headers and hands back the location", async () => {
    apiFetch.mockResolvedValue(new Response(null, {
      status: 201,
      headers: { "tus-resumable": "1.0.0", location: `/api/uploads/${ID}`, "set-cookie": "x=1" },
    }));

    const response = await POST(request("POST", "/api/uploads", {
      "tus-resumable": "1.0.0",
      "upload-length": "10",
      cookie: "session=secret",
    }), params());

    const [path, init] = apiFetch.mock.calls[0];

    expect(path).toBe("/api/uploads");
    expect(init.headers.get("upload-length")).toBe("10");
    expect(init.headers.get("cookie")).toBeNull();
    expect(response.status).toBe(201);
    expect(response.headers.get("location")).toBe(`/api/uploads/${ID}`);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("access-control-expose-headers")).toContain("upload-offset");
  });

  it("streams a chunk to the server's upload", async () => {
    apiFetch.mockResolvedValue(new Response(null, { status: 204, headers: { "upload-offset": "4" } }));

    const response = await PATCH(request("PATCH", `/api/uploads/${ID}`, {
        "upload-offset": "0",
        "content-type": "application/offset+octet-stream",
      },
      new Uint8Array([1, 2, 3, 4])), params([ID]));

    expect(apiFetch.mock.calls[0][0]).toBe(`/api/uploads/${ID}`);
    expect(apiFetch.mock.calls[0][1].body).toBeTruthy();
    expect(response.headers.get("upload-offset")).toBe("4");
  });

  it("answers HEAD without a body and lets OPTIONS through from anywhere", async () => {
    apiFetch.mockResolvedValue(new Response("ignored", { status: 200, headers: { "upload-offset": "4" } }));
    expect(await (await HEAD(request("HEAD", `/api/uploads/${ID}`, { origin: "https://evil.test" }), params([ID]))).text()).toBe("");

    apiFetch.mockResolvedValue(new Response(null, { status: 204, headers: { "tus-version": "1.0.0" } }));
    expect((await OPTIONS(request("OPTIONS", "/api/uploads", { origin: "https://evil.test" }), params())).headers.get("tus-version")).toBe("1.0.0");
  });

  it("refuses odd paths and changes from other sites", async () => {
    expect((await PATCH(request("PATCH", "/api/uploads/x"), params(["../../admin"]))).status).toBe(400);
    expect((await PATCH(request("PATCH", "/api/uploads/x"), params([ID, "more"]))).status).toBe(400);
    expect((await POST(request("POST", "/api/uploads", { origin: "https://evil.test" }), params())).status).toBe(403);
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
