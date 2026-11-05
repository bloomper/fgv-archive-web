/** The kinds of record Spexarkivet's change log has. */
export const ENTITY_TYPES = ["MANUSCRIPT", "ARRANGEMENT", "VERSION", "FILE", "NUMBER", "SHARE_LINK", "INSTRUMENT",
  "FILE_ROLE", "SETTINGS", "TRASH"] as const;

/**
 * Where a record in the change log can be seen. Files and numbers are shown on their version's and spex' pages, which
 * the log does not know, so they have no link.
 */
export function auditLink(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "MANUSCRIPT":
      return `/manuscripts/${entityId}`;
    case "ARRANGEMENT":
      return `/arrangements/${entityId}`;
    case "VERSION":
      return `/versions/${entityId}/edit`;
    case "FILE":
      return `/files/${entityId}`;
    case "SHARE_LINK":
      return "/manage/share-links";
    case "INSTRUMENT":
      return "/admin/instruments";
    case "FILE_ROLE":
      return "/admin/file-roles";
    case "SETTINGS":
      return "/admin/settings";
    default:
      return null;
  }
}
