import { AccessTokenClaims, type Role } from "@/types/auth";

export const CLIENT_ID = "fgv-archive";

export const hasAccess = (roles: Role[]) => roles.includes("USER");
/** Editors upload and edit; admins can do everything editors can. */
export const isEditor = (roles: Role[]) => hasAccess(roles) && (roles.includes("EDITOR") || roles.includes("ADMIN"));
export const isAdmin = (roles: Role[]) => hasAccess(roles) && roles.includes("ADMIN");

function normalizeRole(value: string): Role | null {
  const v = value.trim().toUpperCase();
  if (v === "USER" || v === "EDITOR" || v === "ADMIN") {
    return v;
  }
  return null;
}

/**
 * Roles from the `fgv-archive` client roles in the access token. They only decide which pages to show; the server
 * enforces every rule.
 */
export function extractRolesFromClaims(claims: AccessTokenClaims): Role[] {
  const rawRoles = claims.resource_access?.[CLIENT_ID]?.roles ?? [];
  const roles = rawRoles
    .map(normalizeRole)
    .filter((r): r is Role => r !== null);

  return Array.from(new Set(roles));
}

export const appendLogoutParams = (
  logoutUrl: string,
  locale?: string,
  theme?: "light" | "dark" | "system",
): string => {
  if (!locale && !theme) {
    return logoutUrl;
  }

  const separator = logoutUrl.includes("?") ? "&" : "?";
  const urlParams = new URLSearchParams();

  if (locale) {
    urlParams.append("ui_locales", locale);
  }
  if (theme) {
    urlParams.append("theme", theme);
  }

  return `${logoutUrl}${separator}${urlParams.toString()}`;
};

export function normalizeTheme(value?: string): "light" | "dark" | "system" | undefined {
  if (value === "light" || value === "dark" || value === "system") return value;
  return undefined;
}

/**
 * Where to come back to after logging in: a path in this application, never another site, e.g. the version an access
 * request email links to.
 */
export function returnPath(value: string | null): string {
  // Browsers drop tabs and newlines from addresses, so "/\t/evil.example" would become "//evil.example": refuse
  // whitespace, control characters and backslashes anywhere, not only after the first slash
  if (!value || !/^\/(?!\/)/.test(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) {
    return "/";
  }
  try {
    const url = new URL(value, "http://return.invalid");

    return url.origin === "http://return.invalid" && !url.pathname.startsWith("/api/")
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}

/**
 * The login address that comes back to the path afterwards.
 */
export function loginHref(path: string | null | undefined): string {
  const back = returnPath(path ?? null);

  return back === "/" ? "/api/auth/login" : `/api/auth/login?returnTo=${encodeURIComponent(back)}`;
}
