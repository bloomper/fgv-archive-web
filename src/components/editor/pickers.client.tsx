"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  INSTRUMENT_GROUPS,
  isMode,
  isPitch,
  isTonic,
  type Key,
  localName,
  MODES,
  noteName,
  PITCHES,
  TONICS,
  type Transposition,
} from "@/utils/music";

export type PickerInstrument = {
  id: string;
  nameSv: string;
  nameEn: string;
  group: string;
  position: number;
  defaultTransposition: Transposition;
};

/**
 * A key: the tonic with the spelling the arranger used (17 spellings, named in the user's language) and major or minor.
 */
export function KeySelect({ value, onChange, id, label, allowNone = false }: {
  value: Key | null;
  onChange: (key: Key | null) => void;
  id: string;
  label: string;
  allowNone?: boolean;
}) {
  const t = useTranslations("KeyPicker");
  const locale = useLocale();

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      <NativeSelect id={id} aria-label={t("tonic")} value={value?.tonic ?? ""} onChange={event => {
        const tonic = event.target.value;

        onChange(isTonic(tonic) ? { tonic, mode: value?.mode ?? "MAJOR" } : null);
      }}>
        {allowNone && <NativeSelectOption value="">{t("none")}</NativeSelectOption>}
        {TONICS.map(tonic => <NativeSelectOption key={tonic} value={tonic}>{noteName(tonic, locale)}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect aria-label={t("mode")} value={value?.mode ?? "MAJOR"} disabled={!value} onChange={event => {
        const mode = event.target.value;

        if (value && isMode(mode)) {
          onChange({ ...value, mode });
        }
      }}>
        {MODES.map(mode => <NativeSelectOption key={mode} value={mode}>{t(mode)}</NativeSelectOption>)}
      </NativeSelect>
    </div>
  );
}

/**
 * The concert key and the keys it modulates to, in order.
 */
export function KeyPicker({ value, modulations, onChange }: {
  value: Key | null;
  modulations: Key[];
  onChange: (key: Key | null, modulations: Key[]) => void;
}) {
  const t = useTranslations("KeyPicker");
  const move = (index: number, delta: number) => {
    const next = [...modulations];
    const [item] = next.splice(index, 1);

    next.splice(index + delta, 0, item);
    onChange(value, next);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{t("key")}</legend>
      <KeySelect id="version-key" label={t("key")} value={value} allowNone
                 onChange={key => onChange(key, key ? modulations : [])} />
      {value && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("modulations")}</p>
          <ol className="space-y-2">
            {modulations.map((modulation, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">→</span>
                <KeySelect id={`modulation-${index}`} label={t("modulation", { number: index + 1 })} value={modulation}
                           onChange={key => onChange(value, key
                             ? modulations.map((item, i) => (i === index ? key : item))
                             : modulations.filter((_, i) => i !== index))} />
                <Button type="button" size="icon-sm" variant="ghost" disabled={index === 0}
                        aria-label={t("moveUp", { number: index + 1 })} onClick={() => move(index, -1)}><ArrowUp /></Button>
                <Button type="button" size="icon-sm" variant="ghost" disabled={index === modulations.length - 1}
                        aria-label={t("moveDown", { number: index + 1 })} onClick={() => move(index, 1)}><ArrowDown /></Button>
                <Button type="button" size="icon-sm" variant="ghost" aria-label={t("remove", { number: index + 1 })}
                        onClick={() => onChange(value, modulations.filter((_, i) => i !== index))}><X /></Button>
              </li>
            ))}
          </ol>
          <Button type="button" size="sm" variant="outline"
                  onClick={() => onChange(value, [...modulations, modulations.at(-1) ?? value])}>
            <Plus /> {t("addModulation")}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

/**
 * Instruments grouped as the admins group them, for a native select.
 */
export function InstrumentOptions({ instruments, exclude = [] }: { instruments: PickerInstrument[]; exclude?: string[] }) {
  const t = useTranslations("InstrumentGroups");
  const locale = useLocale();

  return INSTRUMENT_GROUPS.map(group => {
    const members = instruments.filter(instrument => instrument.group === group && !exclude.includes(instrument.id))
      .sort((a, b) => a.position - b.position);

    return members.length === 0 ? null : (
      <optgroup key={group} label={t(group)}>
        {members.map(instrument => (
          <option key={instrument.id} value={instrument.id}>{localName(instrument, locale)}</option>
        ))}
      </optgroup>
    );
  });
}

/**
 * The instruments a part carries, in order: a part may be for trumpet 1 and 2, or for flute doubling piccolo.
 */
export function InstrumentsPicker({ instruments, value, onChange, id }: {
  instruments: PickerInstrument[];
  value: string[];
  onChange: (ids: string[]) => void;
  id: string;
}) {
  const t = useTranslations("InstrumentsPicker");
  const locale = useLocale();
  const byId = new Map(instruments.map(instrument => [instrument.id, instrument]));

  return (
    <div className="space-y-1.5">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("chosen")}>
          {value.map((instrumentId, index) => {
            const instrument = byId.get(instrumentId);
            const name = instrument ? localName(instrument, locale) : instrumentId;

            return (
              <li key={instrumentId} className="inline-flex items-center gap-0.5 rounded-full border bg-secondary py-0.5 pr-1 pl-2.5 text-sm">
                {name}
                {index > 0 && (
                  <button type="button" className="rounded-full p-0.5 hover:bg-accent" aria-label={t("first", { name })}
                          onClick={() => onChange([instrumentId, ...value.filter(other => other !== instrumentId)])}>
                    <ArrowUp className="size-3.5" />
                  </button>
                )}
                <button type="button" className="rounded-full p-0.5 hover:bg-accent" aria-label={t("remove", { name })}
                        onClick={() => onChange(value.filter(other => other !== instrumentId))}>
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <NativeSelect id={id} aria-label={value.length ? t("addMore") : t("add")} value="" onChange={event => {
        if (event.target.value) {
          onChange([...value, event.target.value]);
        }
      }}>
        <NativeSelectOption value="">{value.length ? t("addMore") : t("add")}</NativeSelectOption>
        <InstrumentOptions instruments={instruments} exclude={value} />
      </NativeSelect>
    </div>
  );
}

/**
 * The pitch a part is written in and the octave it sounds in, or none.
 */
export function TranspositionPicker({ value, onChange, id, allowNone = true }: {
  value: Transposition | null;
  onChange: (value: Transposition | null) => void;
  id: string;
  allowNone?: boolean;
}) {
  const t = useTranslations("TranspositionPicker");
  const locale = useLocale();

  return (
    <div className="flex flex-wrap gap-2">
      <NativeSelect id={id} aria-label={t("pitch")} value={value?.pitch ?? ""} onChange={event => {
        const pitch = event.target.value;

        onChange(isPitch(pitch) ? { pitch, octave: value?.octave ?? 0 } : null);
      }}>
        {allowNone && <NativeSelectOption value="">{t("none")}</NativeSelectOption>}
        {PITCHES.map(pitch => (
          <NativeSelectOption key={pitch} value={pitch}>
            {pitch === "C" ? t("concert", { name: noteName(pitch, locale) }) : noteName(pitch, locale)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect aria-label={t("octave")} value={String(value?.octave ?? 0)} disabled={!value}
                    onChange={event => value && onChange({ ...value, octave: Number(event.target.value) })}>
        <NativeSelectOption value="-1">{t("down")}</NativeSelectOption>
        <NativeSelectOption value="0">{t("same")}</NativeSelectOption>
        <NativeSelectOption value="1">{t("up")}</NativeSelectOption>
      </NativeSelect>
    </div>
  );
}
