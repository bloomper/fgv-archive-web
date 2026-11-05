"use client";

import * as React from "react";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CornerDownRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchSpexAction } from "@/app/(app)/manage/actions.server";

export type PickedSpex = {
  id: string;
  title?: string | null;
  year?: number | null;
  revival?: boolean | null;
  parentId?: string | null;
  categoryName?: string | null;
};

/**
 * Picks one spex from Spexregister's copy by title or year. Search results show each original with its revivals
 * indented under it; with `originalsOnly`, revivals cannot be picked (a manuscript belongs to the original).
 */
export function SpexPicker({ value, onChange, originalsOnly = false }: {
  value: PickedSpex | null;
  onChange: (spex: PickedSpex | null) => void;
  originalsOnly?: boolean;
}) {
  const t = useTranslations("SpexPicker");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedSpex[]>([]);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    const timer = setTimeout(() => startSearch(async () => {
      const result = await searchSpexAction(query);

      if (result.ok) {
        setResults(result.data);
      } else {
        toast.error(result.message);
      }
    }), 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (value) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("spex")}</p>
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <SpexName spex={value} revival={t("revival")} />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} aria-label={t("remove")}>
            <X />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="spex-search">{t("spex")}</Label>
      <Input id="spex-search" value={query} placeholder={t("search")} onChange={event => setQuery(event.target.value)} />
      <p className="text-xs text-muted-foreground">{searching ? t("searching") : t("hint")}</p>
      {results.length > 0 && query.trim().length >= 2 && (
        <ul aria-label={t("results")} className="max-h-72 divide-y overflow-y-auto rounded-md border">
          {results.map(item => (
            <li key={item.id}>
              <button type="button" disabled={Boolean(originalsOnly && item.revival)}
                      className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent"
                      onClick={() => {
                        onChange(item);
                        setResults([]);
                        setQuery("");
                      }}>
                {item.revival && <CornerDownRight className="ml-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
                <SpexName spex={item} revival={t("revival")} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpexName({ spex, revival }: { spex: PickedSpex; revival: string }) {
  return (
    <span>
      {[spex.title, spex.year].filter(Boolean).join(" ")}
      {spex.revival && <span className="text-muted-foreground"> ({revival.toLowerCase()})</span>}
      {spex.categoryName && <span className="text-muted-foreground"> · {spex.categoryName}</span>}
    </span>
  );
}
