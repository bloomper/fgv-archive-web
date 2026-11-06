import { describe, expect, it, vi } from "vitest";
import { withPolicyAction, withPolicyPage } from "@/utils/route.server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  forbidden: vi.fn(() => {
    throw new Error("forbidden");
  }),
}));

const requireUserMock = vi.fn(async () => ({ session: {}, roles: ["USER"] }));
vi.mock("@/utils/auth.server", () => ({ requireUser: () => requireUserMock() }));

const ok = async () => ({ ok: true as const, roles: ["USER" as const] });
const unauthenticated = async () => ({ ok: false as const, status: 401 as const, message: "Not authenticated" });
const forbidden = async () => ({ ok: false as const, status: 403 as const, message: "Not authorized" });

describe("route.server", () => {
  it("runs the handler when the policy allows it", async () => {
    expect(await withPolicyAction(ok, async () => "done")).toBe("done");
    expect(await withPolicyPage(ok, async ({ roles }) => roles)).toEqual(["USER"]);
  });

  it("sends an action without a session to login and refuses others", async () => {
    await expect(withPolicyAction(unauthenticated, async () => "x")).rejects.toThrow("redirect:/api/auth/login");
    await expect(withPolicyAction(forbidden, async () => "x")).rejects.toThrow("Not authorized");
  });

  it("sends a page without a session to login and shows the forbidden page to a user who lacks the role", async () => {
    await expect(withPolicyPage(unauthenticated, async () => "x")).rejects.toThrow("redirect:/api/auth/login");
    await expect(withPolicyPage(forbidden, async () => "x")).rejects.toThrow(/^forbidden$/);
  });

  it("sends a page to the no-access page when the user has no access at all", async () => {
    requireUserMock.mockResolvedValueOnce({ session: {}, roles: [] });
    const handler = vi.fn();

    await expect(withPolicyPage(forbidden, handler)).rejects.toThrow("redirect:/no-access");
    expect(handler).not.toHaveBeenCalled();
  });
});
