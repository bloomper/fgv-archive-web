import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as file } from "@/app/api/files/[id]/route";
import { GET as preview } from "@/app/api/files/[id]/preview/route";
import { GET as share } from "@/app/api/share/[token]/[...path]/route";
import { GET as versionZip } from "@/app/api/versions/[id]/zip/route";
import { GET as versionParts } from "@/app/api/versions/[id]/parts/zip/route";
import { GET as spexParts } from "@/app/api/spex/[id]/parts/zip/route";

const streamFromApi = vi.hoisted(() => vi.fn(async () => new Response("ok")));

vi.mock("@/lib/http/proxy.server", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/http/proxy.server")>()), streamFromApi }));
vi.mock("@/lib/share/share.server", () => ({ TOKEN: /^[A-Za-z0-9_-]{16,128}$/ }));

const ID = "00000000-0000-7000-8000-000000000001";
const TOKEN = "exempel-giltig-delningslank-0000000000000001";
const request = (query = "") => new NextRequest(`http://localhost/x${query}`);
const params = <T, >(value: T) => ({ params: Promise.resolve(value) });

describe("the file routes", () => {
  beforeEach(() => {
    streamFromApi.mockClear();
  });

  it("refuse malformed ids", async () => {
    for (const route of [file, preview, versionZip, versionParts, spexParts]) {
      expect((await route(request(), params({ id: "nope" }))).status).toBe(400);
    }
    expect((await share(request(), params({ token: "short", path: ["zip"] }))).status).toBe(400);
    expect(streamFromApi).not.toHaveBeenCalled();
  });

  it("stream files, previews and zips from the API", async () => {
    await file(request("?download=true"), params({ id: ID }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), `/api/files/${ID}?download=true`);
    await file(request(), params({ id: ID }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), `/api/files/${ID}?download=false`);
    await preview(request(), params({ id: ID }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), `/api/files/${ID}/preview`);
    await versionZip(request(), params({ id: ID }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), `/api/versions/${ID}/zip`);
    await versionParts(request(), params({ id: ID }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), expect.stringContaining(`/api/versions/${ID}/parts/zip`));
    await spexParts(request(), params({ id: ID }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), expect.stringContaining(`/api/spex/${ID}/parts/zip`));
  });

  it("pass only the share endpoints on, anonymously", async () => {
    await share(request(), params({ token: TOKEN, path: ["files", ID] }));
    expect(streamFromApi).toHaveBeenLastCalledWith(expect.anything(), `/api/share/${TOKEN}/files/${ID}?download=false`, { anonymous: true });
    expect((await share(request(), params({ token: TOKEN, path: ["..", "admin"] }))).status).toBe(400);
  });
});
