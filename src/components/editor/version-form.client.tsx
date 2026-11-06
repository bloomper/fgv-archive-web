"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { InstrumentOptions, KeyPicker, type PickerInstrument } from "@/components/editor/pickers.client";
import { updateVersionAction } from "@/app/(app)/manage/actions.server";
import type { Key } from "@/utils/music";
import { localName } from "@/utils/music";
import { spexName } from "@/utils/links";

export type EditableVersion = {
  id: string;
  kind: "MANUSCRIPT" | "ARRANGEMENT";
  label: string;
  usedInSpexId?: string | null;
  date?: string | null;
  notes?: string | null;
  arranger?: string | null;
  key?: Key | null;
  modulations: Key[];
  tempo?: string | null;
  duration?: string | null;
  restricted: boolean;
  instrumentation: { count: number; instrument: { id: string } }[];
};

type SpexOption = { id: string; title?: string | null; year?: number | null; revival: boolean };

/**
 * A version's fields: label, the spex it was used in (the original or one of its revivals), date and notes, and for an
 * arrangement the arranger, the concert key with its modulations, tempo, duration and instrumentation; and whether it
 * is restricted.
 */
export function VersionForm({ version, spex, instruments }: {
  version: EditableVersion;
  /** The original and its revivals. */
  spex: SpexOption[];
  instruments: PickerInstrument[];
}) {
  const t = useTranslations("VersionForm");
  const locale = useLocale();
  const router = useRouter();
  const arrangement = version.kind === "ARRANGEMENT";
  const [label, setLabel] = useState(version.label);
  const [usedIn, setUsedIn] = useState(version.usedInSpexId ?? "");
  const [date, setDate] = useState(version.date ?? "");
  const [notes, setNotes] = useState(version.notes ?? "");
  const [arranger, setArranger] = useState(version.arranger ?? "");
  const [key, setKey] = useState<Key | null>(version.key ? { tonic: version.key.tonic, mode: version.key.mode } : null);
  const [modulations, setModulations] = useState<Key[]>(version.modulations.map(({ tonic, mode }) => ({ tonic, mode })));
  const [tempo, setTempo] = useState(version.tempo ?? "");
  const [duration, setDuration] = useState(version.duration ?? "");
  const [restricted, setRestricted] = useState(version.restricted);
  const [instrumentation, setInstrumentation] = useState(version.instrumentation.map(entry => ({
    instrumentId: entry.instrument.id,
    count: entry.count,
  })));
  const [pending, startTransition] = useTransition();
  const byId = new Map(instruments.map(instrument => [instrument.id, instrument]));

  const save = () => startTransition(async () => {
    const result = await updateVersionAction(version.id, {
      label: label.trim(),
      usedInSpexId: usedIn || null,
      date: date || null,
      notes: notes.trim() || null,
      restricted,
      ...(arrangement ? {
        arranger: arranger.trim() || null,
        key,
        modulations: key ? modulations : [],
        tempo: tempo.trim() || null,
        duration: duration.trim() || null,
        instrumentation: instrumentation.filter(entry => entry.count > 0),
      } : {}),
    });

    if (result.ok) {
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  return (
    <form className="grid gap-4" aria-label={t("title")} onSubmit={event => {
      event.preventDefault();
      save();
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="version-label">{t("label")}</Label>
          <Input id="version-label" value={label} required maxLength={200} onChange={event => setLabel(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="version-used-in">{t("usedIn")}</Label>
          <NativeSelect id="version-used-in" value={usedIn} onChange={event => setUsedIn(event.target.value)} className="w-full">
            <NativeSelectOption value="">{t("notUsed")}</NativeSelectOption>
            {spex.map(option => (
              <NativeSelectOption key={option.id} value={option.id}>
                {spexName(option)}{option.revival ? ` (${t("revival")})` : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="version-date">{t("date")}</Label>
          <Input id="version-date" type="date" value={date} onChange={event => setDate(event.target.value)} />
        </div>
        {arrangement && (
          <div className="space-y-1.5">
            <Label htmlFor="version-arranger">{t("arranger")}</Label>
            <Input id="version-arranger" value={arranger} maxLength={255} onChange={event => setArranger(event.target.value)} />
          </div>
        )}
      </div>

      {arrangement && (
        <>
          <KeyPicker value={key} modulations={modulations} onChange={(nextKey, nextModulations) => {
            setKey(nextKey);
            setModulations(nextModulations);
          }} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="version-tempo">{t("tempo")}</Label>
              <Input id="version-tempo" value={tempo} maxLength={100} onChange={event => setTempo(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="version-duration">{t("duration")}</Label>
              <Input id="version-duration" value={duration} maxLength={100} onChange={event => setDuration(event.target.value)} />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("instrumentation")}</legend>
            <ul className="space-y-1.5">
              {instrumentation.map((entry, index) => {
                const instrument = byId.get(entry.instrumentId);
                const name = instrument ? localName(instrument, locale) : entry.instrumentId;

                return (
                  <li key={entry.instrumentId} className="flex items-center gap-2">
                    <Input type="number" min={1} max={99} value={entry.count} className="w-20"
                           aria-label={t("countOf", { name })}
                           onChange={event => setInstrumentation(list => list.map((item, i) =>
                             (i === index ? { ...item, count: Number(event.target.value) } : item)))} />
                    <span className="flex-1 text-sm">{name}</span>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label={t("removeInstrument", { name })}
                            onClick={() => setInstrumentation(list => list.filter((_, i) => i !== index))}><X /></Button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-muted-foreground" aria-hidden />
              <NativeSelect aria-label={t("addInstrument")} value="" onChange={event => {
                const id = event.target.value;

                if (id) {
                  setInstrumentation(list => [...list, { instrumentId: id, count: 1 }]);
                }
              }}>
                <NativeSelectOption value="">{t("addInstrument")}</NativeSelectOption>
                <InstrumentOptions instruments={instruments} exclude={instrumentation.map(entry => entry.instrumentId)} />
              </NativeSelect>
            </div>
          </fieldset>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="version-notes">{t("notes")}</Label>
        <Textarea id="version-notes" value={notes} rows={3} maxLength={10000} onChange={event => setNotes(event.target.value)} />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox checked={restricted} onCheckedChange={checked => setRestricted(checked === true)} className="mt-0.5" />
        <span>
          <span className="font-medium">{t("restricted")}</span>
          <span className="block text-xs text-muted-foreground">{t("restrictedHint")}</span>
        </span>
      </label>

      <div>
        <Button type="submit" disabled={pending || !label.trim()}>{t("save")}</Button>
      </div>
    </form>
  );
}
