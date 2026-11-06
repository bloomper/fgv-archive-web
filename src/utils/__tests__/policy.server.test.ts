import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { Policies } from "@/utils/policy.server";
import { tokenWithRoles } from "@/utils/__tests__/token";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T, >(fn: T) => fn,
}));

function loggedIn(roles: string[]) {
  vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "1" } } as never);
  vi.mocked(auth.api.getAccessToken).mockResolvedValue({ accessToken: tokenWithRoles(roles) } as never);
}

describe("Policies", () => {
  beforeEach(() => vi.resetAllMocks());

  it("app.requireAccess needs USER", async () => {
    loggedIn(["ADMIN"]);
    expect((await Policies.app.requireAccess()).ok).toBe(false);
    loggedIn(["USER"]);
    expect((await Policies.app.requireAccess()).ok).toBe(true);
  });

  it("editor.requireEditor needs USER and EDITOR or ADMIN", async () => {
    loggedIn(["USER"]);
    expect((await Policies.editor.requireEditor()).ok).toBe(false);
    loggedIn(["EDITOR"]);
    expect((await Policies.editor.requireEditor()).ok).toBe(false);
    loggedIn(["USER", "EDITOR"]);
    expect((await Policies.editor.requireEditor()).ok).toBe(true);
    loggedIn(["USER", "ADMIN"]);
    expect((await Policies.editor.requireEditor()).ok).toBe(true);
  });

  it("admin.requireAdmin needs USER and ADMIN", async () => {
    loggedIn(["USER", "EDITOR"]);
    expect((await Policies.admin.requireAdmin()).ok).toBe(false);
    loggedIn(["ADMIN"]);
    expect((await Policies.admin.requireAdmin()).ok).toBe(false);
    loggedIn(["USER", "ADMIN"]);
    expect((await Policies.admin.requireAdmin()).ok).toBe(true);
  });
});
