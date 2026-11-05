import { isPitch, type Pitch } from "@/utils/music";

/**
 * Narrows parts to some instruments and transpositions; empty lists do not narrow. A part matches when it carries any
 * of the instruments and is written in any of the pitches.
 */
export type PartFilter = { instrumentIds: string[]; transpositions: Pitch[] };

export const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const EMPTY_FILTER: PartFilter = { instrumentIds: [], transpositions: [] };

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: Params, name: string): string[] {
  const raw = params instanceof URLSearchParams ? params.getAll(name) : [params[name]].flat();

  return raw.filter((value): value is string => typeof value === "string")
    .flatMap(value => value.split(","))
    .map(value => value.trim())
    .filter(Boolean);
}

const unique = <T, >(values: T[]) => [...new Set(values)];

/**
 * The part filter of a page's address: `instruments` and `pitches`, comma separated or repeated. Anything that is
 * not an id or a pitch is left out.
 */
export function partFilterFromParams(params: Params): PartFilter {
  return {
    instrumentIds: unique(read(params, "instruments").filter(id => ID.test(id))),
    transpositions: unique(read(params, "pitches").filter(isPitch)),
  };
}

export function isEmptyFilter(filter: PartFilter): boolean {
  return filter.instrumentIds.length === 0 && filter.transpositions.length === 0;
}

/**
 * The page query for a filter, e.g. "instruments=a,b&pitches=B_FLAT", without a leading "?"; empty when nothing narrows.
 */
export function partFilterToPageQuery(filter: PartFilter): string {
  const params = new URLSearchParams();

  if (filter.instrumentIds.length) {
    params.set("instruments", filter.instrumentIds.join(","));
  }
  if (filter.transpositions.length) {
    params.set("pitches", filter.transpositions.join(","));
  }
  return params.toString().replace(/%2C/g, ",");
}

/**
 * The query the API's parts zips take: `instrumentIds` and `transpositions`, comma separated; empty when nothing narrows.
 */
export function partFilterToApiQuery(filter: PartFilter): string {
  const params = new URLSearchParams();

  if (filter.instrumentIds.length) {
    params.set("instrumentIds", filter.instrumentIds.join(","));
  }
  if (filter.transpositions.length) {
    params.set("transpositions", filter.transpositions.join(","));
  }
  return params.toString().replace(/%2C/g, ",");
}

/**
 * The API's parts zip query as the web's own route handlers get it, checked: ids and pitches only.
 */
export function apiQueryFromParams(params: URLSearchParams): string {
  return partFilterToApiQuery({
    instrumentIds: unique(read(params, "instrumentIds").filter(id => ID.test(id))),
    transpositions: unique(read(params, "transpositions").filter(isPitch)),
  });
}

/**
 * A path with a query, without "?" when the query is empty.
 */
export function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}

/**
 * The filter for GraphQL: null when nothing narrows.
 */
export function toGraphqlFilter(filter: PartFilter): PartFilter | null {
  return isEmptyFilter(filter) ? null : filter;
}
