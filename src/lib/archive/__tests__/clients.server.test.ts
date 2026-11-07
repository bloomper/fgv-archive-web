import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as archive from "@/lib/archive/archive.server";
import * as editing from "@/lib/archive/editing.server";
import * as admin from "@/lib/admin/admin.server";
import { getSharedView } from "@/lib/share/share.server";
import { GraphQLRequestError } from "@/lib/graphql.server";

const { runQuery, runMutation } = vi.hoisted(() => ({ runQuery: vi.fn(), runMutation: vi.fn() }));

vi.mock("@/lib/graphql.server", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/graphql.server")>()), runQuery, runMutation }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "sv" }));

/** An answer that has every field, however deep: each property is the answer again, and it can be listed. */
const full: unknown = new Proxy(() => undefined, {
  get: (_, key) => key === "then" ? undefined : key === Symbol.iterator ? [][Symbol.iterator] : key === "length" ? 0 : full,
});

const clients = { archive, editing, admin } as Record<string, Record<string, unknown>>;
const calls = Object.entries(clients).flatMap(([module, exports]) =>
  Object.entries(exports).filter(([, value]) => typeof value === "function")
    .map(([name, fn]) => [`${module}.${name}`, fn as (...args: unknown[]) => Promise<unknown>] as const));

describe("the GraphQL clients", () => {
  beforeEach(() => {
    runQuery.mockReset();
    runMutation.mockReset();
  });

  it.each(calls)("%s asks the API and copes with an empty answer", async (_, fn) => {
    const args = ["00000000-0000-7000-8000-000000000001", { instrumentIds: [] }, 60, true];

    runQuery.mockResolvedValue(undefined);
    runMutation.mockResolvedValue(undefined);
    await fn(...args);
    expect(runQuery.mock.calls.length + runMutation.mock.calls.length).toBeGreaterThanOrEqual(1);

    runQuery.mockResolvedValue(full);
    runMutation.mockResolvedValue(full);
    await fn(...args);
  });
});

describe("share links", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("are asked for without a session, and an unknown or malformed token opens nothing", async () => {
    expect(await getSharedView("short")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: { sharedView: { name: "Orkester" } } })));
    expect(await getSharedView("exempel-giltig-delningslank-0000000000000001", { instrumentIds: ["i1"] })).toEqual({ name: "Orkester" });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBeNull();
    expect(JSON.parse(String(init.body)).variables).toEqual({ token: "exempel-giltig-delningslank-0000000000000001", parts: { instrumentIds: ["i1"] } });

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: null })));
    expect(await getSharedView("exempel-giltig-delningslank-0000000000000001")).toBeNull();
  });

  it("pass the server's errors on", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ message: "Utgången", extensions: { classification: "NOT_FOUND" } }] })));
    await expect(getSharedView("exempel-giltig-delningslank-0000000000000001")).rejects.toThrow(GraphQLRequestError);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ message: "Fel" }] })));
    await expect(getSharedView("exempel-giltig-delningslank-0000000000000001")).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
