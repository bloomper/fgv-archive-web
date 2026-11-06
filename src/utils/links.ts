/**
 * Where things are in the web. Files are read and downloaded through the web's route handlers, which add the user's
 * token, or, under a share link, the link's token in the address.
 */

export type Place = { share?: string };

export const spexHref = (id: string) => `/spex/${id}`;
export const spexPartsHref = (id: string) => `/spex/${id}/parts`;
export const manuscriptHref = (id: string) => `/manuscripts/${id}`;
export const arrangementHref = (id: string) => `/arrangements/${id}`;
export const versionEditHref = (id: string) => `/versions/${id}/edit`;
export const versionAnchor = (id: string) => `version-${id}`;

/**
 * A version in its manuscript's or arrangement's page.
 */
export function versionHref(version: { id: string; kind: string; parentId: string }): string {
  const parent = version.kind === "MANUSCRIPT" ? manuscriptHref(version.parentId) : arrangementHref(version.parentId);

  return `${parent}#${versionAnchor(version.id)}`;
}

/** The reader page of a file, at a page when given. */
export function fileHref(id: string, { share }: Place = {}, page?: number | null): string {
  const path = share ? `/share/${share}/files/${id}` : `/files/${id}`;

  return page && page > 1 ? `${path}?page=${page}` : path;
}

const apiBase = ({ share }: Place) => (share ? `/api/share/${share}` : "/api");

/** The file itself, for pdf.js (byte ranges). */
export const fileRawHref = (id: string, place: Place = {}) => `${apiBase(place)}/files/${id}`;
export const fileDownloadHref = (id: string, place: Place = {}) => `${apiBase(place)}/files/${id}?download=true`;
export const previewHref = (id: string, place: Place = {}) => `${apiBase(place)}/files/${id}/preview`;
export const versionZipHref = (id: string, place: Place = {}) => `${apiBase(place)}/versions/${id}/zip`;
export const versionPartsZipHref = (id: string, query: string, place: Place = {}) =>
  `${apiBase(place)}/versions/${id}/parts/zip${query ? `?${query}` : ""}`;
export const spexPartsZipHref = (id: string, query: string) => `/api/spex/${id}/parts/zip${query ? `?${query}` : ""}`;
export const sharePartsZipHref = (token: string, query: string) => `/api/share/${token}/parts/zip${query ? `?${query}` : ""}`;

export const isPdf = (file: { contentType: string }) => file.contentType === "application/pdf";

/**
 * A spex as "Title year", e.g. "Ali Baba 2028".
 */
export function spexName(spex: { title?: string | null; year?: number | null } | null | undefined): string {
  return [spex?.title, spex?.year].filter(value => value !== null && value !== undefined && value !== "").join(" ");
}

/**
 * A size in bytes as kB, MB or GB with one decimal.
 */
export function formatBytes(bytes: number | null | undefined, locale: string): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return "–";
  }

  const units = ["B", "kB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }

  const number = new Intl.NumberFormat(locale === "en" ? "en-GB" : "sv-SE", {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);

  return `${number} ${units[unit]}`;
}
