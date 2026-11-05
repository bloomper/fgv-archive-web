/**
 * Change log helpers that need no server: which actions and record types exist, where a record is edited, and the
 * filter as it travels in the address.
 */

export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "PUBLISH", "UNPUBLISH", "TRASH", "RESTORE", "DELETE", "SHARE", "REVOKE"] as const;

export type AuditSearch = {
  page?: string;
  type?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  q?: string;
  entity?: string
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The instant a day starts in Swedish time, as ISO; null for anything but yyyy-mm-dd.
 */
export function startOfDay(day: string | undefined, plusDays = 0): string | null {
  if (!day || !DAY.test(day)) {
    return null;
  }

  const noon = new Date(`${day}T12:00:00Z`);

  if (Number.isNaN(noon.getTime())) {
    return null;
  }
  noon.setUTCDate(noon.getUTCDate() + plusDays);

  // Swedish time is UTC+1 or +2; read the offset at noon, which no daylight saving change crosses
  const local = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(noon);
  const offsetHours = Number(local) - 12;
  const midnight = new Date(Date.UTC(noon.getUTCFullYear(), noon.getUTCMonth(), noon.getUTCDate()) - offsetHours * 3600_000);

  return midnight.toISOString();
}

/**
 * The address of the change log with this filter and page; empty parts are left out.
 */
export function auditHref(path: string, search: AuditSearch, changes: Partial<AuditSearch> = {}): string {
  const merged = { ...search, ...changes };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value && !(key === "page" && value === "0")) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}
