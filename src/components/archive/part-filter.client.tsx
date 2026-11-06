"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { INSTRUMENT_GROUPS, localName, noteName, type Pitch, PITCHES } from "@/utils/music";
import { partFilterFromParams, partFilterToPageQuery, type PartFilter } from "@/utils/filters";
import { cn } from "@/utils/utils";

type Instrument = { id: string; nameSv: string; nameEn: string; group: string; position: number };

/**
 * Narrows parts to one or more instruments and transpositions through the address (`instruments`, `pitches`), so that
 * a filtered list can be linked to. Each choice is a toggle; a part matches when it carries any chosen instrument and
 * is written in any chosen pitch.
 */
export function PartFilterControls({ instruments, pitches = PITCHES, value, onChange }: {
  /** The instruments to offer, e.g. those that occur. */
  instruments: Instrument[];
  /** The pitches to offer; all by default. */
  pitches?: readonly Pitch[];
  /** With onChange: the filter is this state instead of the address, e.g. in a form. */
  value?: PartFilter;
  onChange?: (filter: PartFilter) => void;
}) {
  const t = useTranslations("PartFilter");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const filter = value ?? partFilterFromParams(params);

  const apply = (next: PartFilter) => {
    if (onChange) {
      onChange(next);
      return;
    }

    const query = new URLSearchParams(params);

    query.delete("instruments");
    query.delete("pitches");
    for (const [key, value] of new URLSearchParams(partFilterToPageQuery(next))) {
      query.set(key, value);
    }

    const search = query.toString().replace(/%2C/g, ",");

    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  };
  const toggle = <T, >(list: T[], value: T) => list.includes(value) ? list.filter(item => item !== value) : [...list, value];
  const sorted = [...instruments].sort((a, b) =>
    INSTRUMENT_GROUPS.indexOf(a.group as typeof INSTRUMENT_GROUPS[number]) - INSTRUMENT_GROUPS.indexOf(b.group as typeof INSTRUMENT_GROUPS[number])
    || a.position - b.position);
  const chip = (active: boolean) => cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent");
  const active = filter.instrumentIds.length + filter.transpositions.length > 0;

  return (
    <div className="space-y-2 rounded-lg border p-3" data-testid="part-filter">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("title")}</p>
        <span className="flex items-center gap-2">
          {pending && <Spinner className="size-4" />}
          {active && (
            <button type="button" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    onClick={() => apply({ instrumentIds: [], transpositions: [] })}>
              <X className="size-3.5" /> {t("clear")}
            </button>
          )}
        </span>
      </div>
      {sorted.length > 0 && (
        <div role="group" aria-label={t("instruments")} className="flex flex-wrap gap-1.5">
          {sorted.map(instrument => {
            const on = filter.instrumentIds.includes(instrument.id);

            return (
              <button key={instrument.id} type="button" aria-pressed={on} className={chip(on)}
                      onClick={() => apply({ ...filter, instrumentIds: toggle(filter.instrumentIds, instrument.id) })}>
                {on && <Check className="size-3.5" aria-hidden />}
                {localName(instrument, locale)}
              </button>
            );
          })}
        </div>
      )}
      {pitches.length > 0 && (
        <div role="group" aria-label={t("transpositions")} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">{t("writtenIn")}</span>
          {pitches.map(pitch => {
            const on = filter.transpositions.includes(pitch);

            return (
              <button key={pitch} type="button" aria-pressed={on} className={chip(on)}
                      aria-label={t("pitch", { pitch: noteName(pitch, locale) })}
                      onClick={() => apply({ ...filter, transpositions: toggle(filter.transpositions, pitch) })}>
                {on && <Check className="size-3.5" aria-hidden />}
                {noteName(pitch, locale)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
