import { describe, expect, it } from "vitest";
import { Book, FileText, ScrollText } from "lucide-react";
import { groupBySpex, kindIcon, menuKinds, parseAliases } from "@/utils/document-kinds";
import { documentsHref, newDocumentHref } from "@/utils/links";

const kind = (id: string, documentCount: number, retired = false) =>
  ({ id, name: id, nameSv: id, nameEn: id, retired, documentCount });

describe("document kinds", () => {
  it("shows users the kinds with documents, and editors every kind in use too", () => {
    const kinds = [kind("Manus", 2), kind("Program", 0), kind("Gammal", 1, true), kind("Borta", 0, true)];

    expect(menuKinds(kinds, ["USER"]).map(k => k.id)).toEqual(["Manus", "Gammal"]);
    expect(menuKinds(kinds, ["USER", "EDITOR"]).map(k => k.id)).toEqual(["Manus", "Program", "Gammal"]);
  });

  it("guesses an icon from the names and aliases, else a plain document", () => {
    expect(kindIcon({ nameSv: "Manus", nameEn: "Manuscript" })).toBe(ScrollText);
    expect(kindIcon({ nameSv: "Häfte", nameEn: "Booklet", aliases: ["Sångbok"] })).toBe(Book);
    expect(kindIcon({ nameSv: "Affisch", nameEn: "Poster" })).toBe(FileText);
  });

  it("reads aliases one per line", () => {
    expect(parseAliases(" manuskript \r\n\nmanus\nmanuskript\n")).toEqual(["manuskript", "manus"]);
  });

  it("groups documents by spex, newest first, FGV's own last", () => {
    const old = { id: "s1", title: "Nobel", year: 1975 };
    const recent = { id: "s2", title: "Ali Baba", year: 1985 };
    const groups = groupBySpex([
      { id: "d1", spex: old }, { id: "d2", spex: null }, { id: "d3", spex: recent }, { id: "d4", spex: old },
    ]);

    expect(groups.map(group => [group.spex?.id ?? null, group.documents.map(d => d.id)]))
      .toEqual([["s2", ["d3"]], ["s1", ["d1", "d4"]], [null, ["d2"]]]);
  });

  it("links to a kind's documents and a new document", () => {
    expect(documentsHref("k1")).toBe("/documents/k1");
    expect(newDocumentHref()).toBe("/manage/manuscripts/new");
    expect(newDocumentHref({ kindId: "k1", spexId: "s1" })).toBe("/manage/manuscripts/new?kind=k1&spex=s1");
  });
});
