import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { tokenWithRoles } from "@/utils/__tests__/token";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T, >(fn: T) => fn,
}));

const getSession = vi.mocked(auth.api.getSession);
const getAccessToken = vi.mocked(auth.api.getAccessToken);

function loggedIn(roles: string[]) {
  getSession.mockResolvedValue({ user: { id: "1", name: "Kim" }, session: { id: "s" } } as never);
  getAccessToken.mockResolvedValue({ accessToken: tokenWithRoles(roles) } as never);
}

describe("auth.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("has no session or roles when logged out", async () => {
    getSession.mockResolvedValue(null as never);
    const { getSessionContext, getAccessToken: token } = await import("@/utils/auth.server");

    expect(await getSessionContext()).toEqual({ session: null, accessToken: null, roles: [] });
    expect(await token()).toBeNull();
  });

  it("reads roles from the access token", async () => {
    loggedIn(["USER", "ADMIN"]);
    const { requireUser } = await import("@/utils/auth.server");

    expect((await requireUser()).roles).toEqual(["USER", "ADMIN"]);
  });

  it("treats a missing or failing access token as logged out", async () => {
    const { getSessionContext } = await import("@/utils/auth.server");

    getSession.mockResolvedValue({ user: { id: "1" } } as never);
    getAccessToken.mockResolvedValue({ accessToken: null } as never);
    expect((await getSessionContext()).session).toBeNull();

    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    getAccessToken.mockRejectedValue(new Error("expired"));
    expect((await getSessionContext()).session).toBeNull();
  });

  it("refuses a user without the required role", async () => {
    loggedIn(["EDITOR"]);
    const { requireAnyRole } = await import("@/utils/auth.server");

    expect(await requireAnyRole(["USER"])).toEqual({ ok: false, status: 403, message: "Not authorized" });
  });

  it("refuses anyone who is not logged in with 401", async () => {
    getSession.mockResolvedValue(null as never);
    const { requireAnyRole } = await import("@/utils/auth.server");

    expect(await requireAnyRole(["USER"])).toMatchObject({ ok: false, status: 401 });
  });

  it("accepts a user with the role", async () => {
    loggedIn(["USER", "EDITOR"]);
    const { requireAnyRole } = await import("@/utils/auth.server");

    expect(await requireAnyRole(["USER"])).toEqual({ ok: true, roles: ["USER", "EDITOR"] });
  });
});
