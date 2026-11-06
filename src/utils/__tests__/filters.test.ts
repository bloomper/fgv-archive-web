import { describe, expect, it } from "vitest";
import {
  apiQueryFromParams,
  isEmptyFilter,
  partFilterFromParams,
  partFilterToApiQuery,
  partFilterToPageQuery,
  toGraphqlFilter,
  withQuery,
} from "@/utils/filters";
import { sharePath } from "@/utils/share-paths";

const A = "00000000-0000-7000-8000-000000000001";
const B = "00000000-0000-7000-8000-000000000002";

describe("partFilterFromParams", () => {
  it("reads comma-separated and repeated values, drops junk and duplicates", () => {
    expect(partFilterFromParams(new URLSearchParams(`instruments=${A},${B},nope&instruments=${A}&pitches=B_FLAT,H,E_FLAT`)))
      .toEqual({ instrumentIds: [A, B], transpositions: ["B_FLAT", "E_FLAT"] });
  });

  it("reads Next's search params objects", () => {
    expect(partFilterFromParams({ instruments: [A, B], pitches: "C" }))
      .toEqual({ instrumentIds: [A, B], transpositions: ["C"] });
    expect(partFilterFromParams({})).toEqual({ instrumentIds: [], transpositions: [] });
  });
});

describe("queries", () => {
  const filter = { instrumentIds: [A, B], transpositions: ["B_FLAT" as const] };

  it("writes the page's query", () => {
    expect(partFilterToPageQuery(filter)).toBe(`instruments=${A},${B}&pitches=B_FLAT`);
    expect(partFilterToPageQuery({ instrumentIds: [], transpositions: [] })).toBe("");
  });

  it("writes the API's query", () => {
    expect(partFilterToApiQuery(filter)).toBe(`instrumentIds=${A},${B}&transpositions=B_FLAT`);
    expect(partFilterToApiQuery({ instrumentIds: [], transpositions: ["C", "F"] })).toBe("transpositions=C,F");
  });

  it("checks what the route handlers pass on", () => {
    expect(apiQueryFromParams(new URLSearchParams(`instrumentIds=${A},x&transpositions=B_FLAT,ZZ&evil=1`)))
      .toBe(`instrumentIds=${A}&transpositions=B_FLAT`);
  });

  it("leaves empty filters out", () => {
    expect(withQuery("/a", "")).toBe("/a");
    expect(withQuery("/a", "b=1")).toBe("/a?b=1");
    expect(isEmptyFilter({ instrumentIds: [], transpositions: [] })).toBe(true);
    expect(toGraphqlFilter({ instrumentIds: [], transpositions: [] })).toBeNull();
    expect(toGraphqlFilter(filter)).toEqual(filter);
  });
});

describe("sharePath", () => {
  const none = new URLSearchParams();

  it("passes only what a share link opens", () => {
    expect(sharePath(["files", A], new URLSearchParams("download=true"))).toBe(`files/${A}?download=true`);
    expect(sharePath(["files", A], none)).toBe(`files/${A}?download=false`);
    expect(sharePath(["files", A, "preview"], none)).toBe(`files/${A}/preview`);
    expect(sharePath(["versions", A, "zip"], none)).toBe(`versions/${A}/zip`);
    expect(sharePath(["versions", A, "parts", "zip"], new URLSearchParams(`instrumentIds=${B}`)))
      .toBe(`versions/${A}/parts/zip?instrumentIds=${B}`);
    expect(sharePath(["parts", "zip"], new URLSearchParams("transpositions=E_FLAT"))).toBe("parts/zip?transpositions=E_FLAT");
  });

  it("refuses anything else", () => {
    expect(sharePath(["files", "../x"], none)).toBeNull();
    expect(sharePath(["graphql"], none)).toBeNull();
    expect(sharePath(["versions", A, "zip", "x"], none)).toBeNull();
  });
});
