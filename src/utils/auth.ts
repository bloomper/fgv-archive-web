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
