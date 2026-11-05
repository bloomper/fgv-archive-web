import { describe, expect, it } from "vitest";
import {
  appendLogoutParams,
  extractRolesFromClaims,
  hasAccess,
  isAdmin,
  isEditor,
  normalizeTheme,
} from "@/utils/auth";

describe("extractRolesFromClaims", () => {
  it("reads the fgv-archive client roles only", () => {
    expect(extractRolesFromClaims({
      resource_access: {
        "fgv-archive": { roles: ["USER", "editor", "ADMIN", "USER", "SPEXFLIX"] },
        spexregister: { roles: ["ADMIN"] },
      },
    })).toEqual(["USER", "EDITOR", "ADMIN"]);
  });

  it("gives no roles without the claim", () => {
    expect(extractRolesFromClaims({})).toEqual([]);
    expect(extractRolesFromClaims({ resource_access: { spexregister: { roles: ["USER"] } } })).toEqual([]);
  });
});

describe("role helpers", () => {
  it("tells access, editors and admins apart", () => {
    expect(hasAccess(["USER"])).toBe(true);
    expect(hasAccess(["ADMIN"])).toBe(false);
    expect(isEditor(["USER", "EDITOR"])).toBe(true);
    expect(isEditor(["USER", "ADMIN"])).toBe(true);
    expect(isEditor(["EDITOR"])).toBe(false);
    expect(isAdmin(["USER", "EDITOR"])).toBe(false);
    expect(isAdmin(["USER", "ADMIN"])).toBe(true);
  });
});

describe("normalizeTheme", () => {
  it("accepts known themes only", () => {
    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("system")).toBe("system");
    expect(normalizeTheme("neon")).toBeUndefined();
    expect(normalizeTheme(undefined)).toBeUndefined();
  });
});

describe("appendLogoutParams", () => {
  const endSession = "https://kc.example/realms/r/protocol/openid-connect/logout";

  it("returns the URL untouched when there is nothing to append", () => {
    expect(appendLogoutParams(endSession)).toBe(endSession);
  });

  it("appends locale and theme", () => {
    const url = new URL(appendLogoutParams(endSession, "sv", "dark"));

    expect(url.searchParams.get("ui_locales")).toBe("sv");
    expect(url.searchParams.get("theme")).toBe("dark");
  });

  it("preserves the params Better Auth already put on the URL", () => {
    const withHint = `${endSession}?id_token_hint=abc&post_logout_redirect_uri=https%3A%2F%2Fapp.example`;

    const url = new URL(appendLogoutParams(withHint, "en"));

    expect(url.searchParams.get("id_token_hint")).toBe("abc");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe("https://app.example");
    expect(url.searchParams.get("ui_locales")).toBe("en");
    expect(url.searchParams.get("theme")).toBeNull();
  });
});
