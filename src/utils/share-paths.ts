import { apiQueryFromParams, ID, withQuery } from "@/utils/filters";

/**
 * The server path under /api/share/{token}/ for a path of the web's share route, or null when it is none of those a
 * share link opens.
 */
export function sharePath(path: string[], params: URLSearchParams): string | null {
  const [first, id, ...rest] = path;
  const filter = apiQueryFromParams(params);

  if (first === "files" && ID.test(id ?? "") && rest.length === 0) {
    return `files/${id}?download=${params.get("download") === "true"}`;
  }
  if (first === "files" && ID.test(id ?? "") && rest.join("/") === "preview") {
    return `files/${id}/preview`;
  }
  if (first === "versions" && ID.test(id ?? "") && rest.join("/") === "zip") {
    return `versions/${id}/zip`;
  }
  if (first === "versions" && ID.test(id ?? "") && rest.join("/") === "parts/zip") {
    return withQuery(`versions/${id}/parts/zip`, filter);
  }
  if (first === "parts" && id === "zip" && rest.length === 0) {
    return withQuery("parts/zip", filter);
  }
  return null;
}
