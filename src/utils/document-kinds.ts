import {
  Book,
  BookOpen,
  BookText,
  Bus,
  Disc3,
  Feather,
  FileText,
  FolderOpen,
  Lightbulb,
  type LucideIcon,
  Newspaper,
  Palette,
  ScrollText,
} from "lucide-react";
import type { Role } from "@/types/auth";
import { isEditor } from "@/utils/auth";

/** A document kind as the menu and the pages need it. */
export type DocumentKindBrief = {
  id: string;
  name: string;
  nameSv: string;
  nameEn: string;
  aliases?: string[];
  retired: boolean;
  documentCount: number;
};

/**
 * The kinds in the menu: those with documents for users; for editors, every kind still offered for new documents, and
 * retired ones that still have documents.
 */
export function menuKinds<T extends DocumentKindBrief>(kinds: T[], roles: Role[]): T[] {
  const editor = isEditor(roles);

  return kinds.filter(kind => kind.documentCount > 0 || (editor && !kind.retired));
}

// Kinds are admins' data, so an icon is only a guess from the names; anything else is a plain document
const ICONS: [RegExp, LucideIcon][] = [
  [/^(manus|manuscript|script)/, ScrollText],
  [/^(program|programme)/, BookOpen],
  [/^synops/, BookText],
  [/^(pressklipp|press)/, Newspaper],
  [/^(testamente|testament)/, Feather],
  [/^(turn[ée]|tour)/, Bus],
  [/^(teknik|technique|technical)/, Lightbulb],
  [/^(skiva|skivor|record|disc|cd)/, Disc3],
  [/^(spexbok|sångbok|songbook|book)/, Book],
  [/^(smink|make-?up)/, Palette],
  [/^(övrigt|other)/, FolderOpen],
];

export function kindIcon(kind: { nameSv: string; nameEn: string; aliases?: string[] }): LucideIcon {
  const names = [kind.nameSv, kind.nameEn, ...(kind.aliases ?? [])].map(name => name.trim().toLowerCase());

  return ICONS.find(([pattern]) => names.some(name => pattern.test(name)))?.[1] ?? FileText;
}

/**
 * The aliases an admin typed, one per line: trimmed, without empty lines or repeats.
 */
export function parseAliases(text: string): string[] {
  return [...new Set(text.split(/\r?\n/).map(line => line.trim()).filter(Boolean))];
}

/**
 * Documents grouped by spex, newest spex first, then by title; FGV's own, of no spex, last.
 */
export function groupBySpex<T extends { spex?: { id: string; title?: string | null; year?: number | null } | null }>(documents: T[]) {
  const groups = new Map<string, { spex: NonNullable<T["spex"]> | null; documents: T[] }>();

  for (const document of documents) {
    const key = document.spex?.id ?? "";
    const group = groups.get(key) ?? { spex: (document.spex ?? null) as NonNullable<T["spex"]> | null, documents: [] };

    group.documents.push(document);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.spex || !b.spex) {
      return Number(!a.spex) - Number(!b.spex);
    }
    return (b.spex.year ?? 0) - (a.spex.year ?? 0) || (a.spex.title ?? "").localeCompare(b.spex.title ?? "", "sv");
  });
}
