"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/utils";

type Props = {
  years: number[];
  /** The address of a year's list, e.g. `/albums?year=`, to which the year is appended. */
  hrefPrefix: string;
};

const decadeOf = (year: number) => Math.floor(year / 10) * 10;

/**
 * Years to browse by, kept to one row: the decades, newest first, each unfolding its own years. With a single decade
 * there is nothing to fold, so its years are shown at once.
 */
export function YearBrowser({ years, hrefPrefix }: Props) {
  const t = useTranslations("YearBrowser");
  const id = useId();
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  const decades = [...new Set(sorted.map(decadeOf))].sort((a, b) => b - a);
  const [open, setOpen] = useState<number | null>(null);
  const shown = decades.length === 1 ? decades[0] : open;

  if (decades.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {decades.length > 1 && (
        <ul className="flex flex-wrap gap-1.5">
          {decades.map(decade => (
            <li key={decade}>
              <button type="button" aria-expanded={open === decade} aria-controls={`${id}-years`}
                      onClick={() => setOpen(open === decade ? null : decade)}
                      className={cn("inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        open === decade ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>
                {t("decade", { decade })}
                <ChevronDown className={cn("size-3.5 transition-transform", open === decade && "rotate-180")} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div id={`${id}-years`}>
        {shown !== null && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("yearsOf", { decade: shown })}>
            {sorted.filter(year => decadeOf(year) === shown).map(year => (
              <li key={year}>
                <Link href={`${hrefPrefix}${year}`} className="rounded-md border px-2.5 py-1 text-sm tabular-nums hover:bg-accent">
                  {year}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
