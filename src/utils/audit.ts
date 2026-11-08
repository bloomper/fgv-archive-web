/**
 * Change log helpers that need no server: which actions and record types exist, where a record is edited, and the
 * filter as it travels in the address.
 */

export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "PUBLISH", "UNPUBLISH", "TRASH", "RESTORE", "DELETE", "SHARE", "REVOKE"] as const;

export type AuditSearch = {
  type?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  q?: string;
  entity?: string
};

const SEARCH_KEYS = ["type", "action", "actor", "from", "to", "q", "entity"] as const;

/**
 * The filter from the address: only its own parameters, one value each (`?q=a&q=b` arrives as an array; the first
 * counts).
 */
export function auditSearchOf(params: Record<string, string | string[] | undefined> | null | undefined): AuditSearch {
  const search: AuditSearch = {};

  for (const key of SEARCH_KEYS) {
    const value = params?.[key];
    const first = Array.isArray(value) ? value[0] : value;

    if (typeof first === "string" && first) {
      search[key] = first;
    }
  }
  return search;
}

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
 * The address of the change log with this filter; empty parts are left out.
 */
export function auditHref(path: string, search: AuditSearch, changes: Partial<AuditSearch> = {}): string {
  const merged = { ...search, ...changes };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

/** The filter for the server from the address; the person only for admins. */
export function toAuditFilter(search: AuditSearch, isAdmin: boolean) {
  return {
    entityType: search.type || null,
    action: search.action || null,
    actorId: isAdmin ? search.actor || null : null,
    from: startOfDay(search.from),
    to: startOfDay(search.to, 1),
    q: search.q?.trim().slice(0, 100) || null,
    entityId: search.entity || null,
  };
}

/** One change as the change log shows it, with its links worked out on the server. */
export type AuditRow = {
  id: string;
  at: string;
  actorName: string | null;
  action: string;
  entityType: string;
  summary: string;
  /** Where the record can be seen, while it exists. */
  link: string | null;
  /** The change log narrowed to this record. */
  historyHref: string | null;
};

/** A page of the change log: its rows and how many changes match in all. */
export type AuditPage = { rows: AuditRow[]; totalCount: number };

type Entry = {
  id: string;
  at: string;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
};

/**
 * The rows for these changes: a record is linked while it exists, and its history when the log is not already narrowed
 * to it.
 */
export function toAuditRows(
  entries: Entry[],
  path: string,
  linkOf: (entityType: string, entityId: string) => string | null,
  withHistory: boolean
): AuditRow[] {
  return entries.map(entry => ({
    id: entry.id,
    at: entry.at,
    actorName: entry.actorName ?? null,
    action: entry.action,
    entityType: entry.entityType,
    summary: entry.summary,
    link: entry.entityId && entry.action !== "DELETE" ? linkOf(entry.entityType, entry.entityId) : null,
    historyHref: withHistory && entry.entityId ? auditHref(path, {}, { entity: entry.entityId }) : null,
  }));
}
