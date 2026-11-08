import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedError } from "@urql/core";
import { GraphQLError } from "graphql";
import { tokenWithRoles } from "@/utils/__tests__/token";

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  getSessionContext: vi.fn(),
  createClient: vi.fn((options: unknown) => options),
  authExchange: vi.fn((init: unknown) => init),
}));

vi.mock("@/utils/auth.server", () => ({ getAccessToken: mocks.getAccessToken, getSessionContext: mocks.getSessionContext }));
vi.mock("next-intl/server", () => ({
  getLocale: async () => "sv",
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@urql/core", async importOriginal => ({ ...(await importOriginal<typeof import("@urql/core")>()), createClient: mocks.createClient }));
vi.mock("@urql/exchange-auth", () => ({ authExchange: mocks.authExchange }));
vi.mock("@urql/next/rsc", () => ({ registerUrql: (make: () => unknown) => ({ getClient: make }) }));

const fetchMock = vi.fn(async () => new Response("{}"));

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  mocks.getAccessToken.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the GraphQL client", () => {
  type Auth = {
    addAuthToOperation: (operation: unknown) => unknown;
    didAuthError: (error: CombinedError) => boolean;
    refreshAuth: () => Promise<void>;
    willAuthError: () => boolean;
  };
  type Options = { url: string; exchanges: unknown[]; fetch: (input: string, init?: RequestInit) => Promise<Response> };

  it("adds the token once it has one, and asks again when the server says it is not authenticated", async () => {
    vi.stubEnv("API_GRAPHQL_ENDPOINT", "http://api/graphql");
    const { getClient } = await import("@/lib/urql.server");
    const options = getClient() as unknown as Options;
    const init = options.exchanges[1] as (utils: { appendHeaders: (o: unknown, h: Record<string, string>) => unknown }) => Promise<Auth>;
    const appendHeaders = vi.fn((operation: unknown, headers: Record<string, string>) => ({ operation, headers }));
    const auth = await init({ appendHeaders });

    expect(options.url).toBe("http://api/graphql");
    expect(auth.willAuthError()).toBe(true);
    expect(auth.addAuthToOperation("op")).toBe("op");
    mocks.getAccessToken.mockResolvedValue("token-1");
    await auth.refreshAuth();
    expect(auth.willAuthError()).toBe(false);
    expect(auth.addAuthToOperation("op")).toEqual({ operation: "op", headers: { Authorization: "Bearer token-1" } });
    expect(auth.didAuthError(new CombinedError({ graphQLErrors: [new GraphQLError("no", { extensions: { code: "UNAUTHENTICATED" } })] }))).toBe(true);
    expect(auth.didAuthError(new CombinedError({ graphQLErrors: [new GraphQLError("no", { extensions: { code: "NOT_FOUND" } })] }))).toBe(false);
  });

  it("sends the language", async () => {
    const { getClient } = await import("@/lib/urql.server");
    const options = getClient() as unknown as Options;

    await options.fetch("http://api/graphql", { headers: { "content-type": "application/json" } });
    expect(new Headers((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].headers).get("accept-language")).toBe("sv");
  });
});

describe("the plain HTTP endpoints", () => {
  it("are next to GraphQL", async () => {
    const { apiUrl } = await import("@/lib/api.server");

    vi.stubEnv("API_GRAPHQL_ENDPOINT", "http://api:8080/api/graphql");
    expect(apiUrl("/api/uploads")).toBe("http://api:8080/api/uploads");
  });

  it("are called with the token and the language", async () => {
    const { apiFetch } = await import("@/lib/api.server");

    mocks.getAccessToken.mockResolvedValue("t");
    await apiFetch("/api/x");
    expect(new Headers((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].headers).get("authorization")).toBe("Bearer t");
    await apiFetch("/api/share/x", {}, true);
    expect(new Headers((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].headers).get("authorization")).toBeNull();
    mocks.getAccessToken.mockResolvedValue(null);
    await apiFetch("/api/x", { method: "POST" });
    expect(new Headers((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].headers).get("authorization")).toBeNull();
  });
});

describe("the applications", () => {
  it("lists the others from the token's roles, and only Spexarkiv without a session", async () => {
    const { getApplications } = await import("@/utils/applications.server");

    mocks.getSessionContext.mockResolvedValue({ accessToken: null });
    expect((await getApplications()).map(app => app.id)).toEqual(["archive"]);
    mocks.getSessionContext.mockResolvedValue({ accessToken: tokenWithRoles(["USER"]) });
    expect((await getApplications()).map(app => app.id)).toContain("archive");
  });
});
