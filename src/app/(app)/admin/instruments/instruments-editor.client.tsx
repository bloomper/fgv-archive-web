"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GitMerge, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useDialogs } from "@/components/dialogs.client";
import { TranspositionPicker } from "@/components/editor/pickers.client";
import { useServerState } from "@/hooks/use-server-state.client";
import type { ActionResult } from "@/lib/graphql.server";
import type { InstrumentGroup as Group } from "@/gql/graphql";
import { formatTransposition, INSTRUMENT_GROUPS, localName, type Transposition } from "@/utils/music";
import {
  createInstrumentAction,
  deleteInstrumentAction,
  mergeInstrumentAction,
  reorderInstrumentsAction,
  updateInstrumentAction,
} from "../actions.server";

export type AdminInstrument = {
  id: string;
  nameSv: string;
  nameEn: string;
  group: Group;
  position: number;
  abbreviations: string[];
  defaultTransposition: Transposition;
  useCount: number;
};

type Fields = { nameSv: string; nameEn: string; group: Group; abbreviations: string; transposition: Transposition };

const toFields = (instrument?: AdminInstrument): Fields => ({
  nameSv: instrument?.nameSv ?? "",
  nameEn: instrument?.nameEn ?? "",
  group: instrument?.group ?? "OTHER",
  abbreviations: instrument?.abbreviations.join(", ") ?? "",
  transposition: instrument?.defaultTransposition ?? { pitch: "C", octave: 0 },
});

/**
 * The instruments, by group: names, the abbreviations that recognise them in file names, and the transposition a new
 * part gets. One in use cannot be deleted, only merged into another.
 */
export function InstrumentsEditor({ instruments }: { instruments: AdminInstrument[] }) {
  const t = useTranslations("AdminInstruments");
  const groups = useTranslations("InstrumentGroups");
  const locale = useLocale();
  const router = useRouter();
  const dialogs = useDialogs();
  const [order, setOrder] = useServerState(instruments, list => list.map(item => `${item.id}:${item.position}:${item.nameSv}:${item.useCount}`).join("|"));
  const [editing, setEditing] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields>(toFields());
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<ActionResult<unknown>>, done: string) => startTransition(async () => {
    const result = await work();

    if (result.ok) {
      toast.success(done);
    } else {
      toast.error(result.message);
    }
    router.refresh();
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const input = {
      nameSv: fields.nameSv,
      nameEn: fields.nameEn,
      group: fields.group,
      abbreviations: fields.abbreviations.split(",").map(value => value.trim()).filter(Boolean),
      defaultTransposition: fields.transposition,
    };
    const id = editing;

    setEditing(null);
    run(() => id && id !== "new" ? updateInstrumentAction(id, input) : createInstrumentAction(input), t("saved"));
  };

  const move = (instrument: AdminInstrument, delta: number) => {
    const group = order.filter(item => item.group === instrument.group);
    const index = group.indexOf(instrument);
    const target = group[index + delta];

    if (!target) {
      return;
    }

    const next = [...order];
    const a = next.indexOf(instrument);
    const b = next.indexOf(target);

    [next[a], next[b]] = [next[b], next[a]];
    setOrder(next);
    run(() => reorderInstrumentsAction(next.map(item => item.id)), t("reordered"));
  };

  const form = (
    <form onSubmit={submit} className="grid gap-3 rounded-md border bg-muted/40 p-3 sm:grid-cols-2" aria-label={t("form")}>
      <div className="space-y-1">
        <Label htmlFor="instrument-sv">{t("nameSv")}</Label>
        <Input id="instrument-sv" value={fields.nameSv} required maxLength={100} onChange={event => setFields({ ...fields, nameSv: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="instrument-en">{t("nameEn")}</Label>
        <Input id="instrument-en" value={fields.nameEn} required maxLength={100} onChange={event => setFields({ ...fields, nameEn: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="instrument-group">{t("group")}</Label>
        <NativeSelect id="instrument-group" value={fields.group} className="w-full"
                      onChange={event => setFields({ ...fields, group: event.target.value as Group })}>
          {INSTRUMENT_GROUPS.map(group => <NativeSelectOption key={group} value={group}>{groups(group)}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="instrument-transposition">{t("transposition")}</Label>
        <TranspositionPicker id="instrument-transposition" value={fields.transposition} allowNone={false}
                             onChange={value => value && setFields({ ...fields, transposition: value })} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="instrument-abbreviations">{t("abbreviations")}</Label>
        <Input id="instrument-abbreviations" value={fields.abbreviations} placeholder="tpt, trp, trumpet"
               onChange={event => setFields({ ...fields, abbreviations: event.target.value })} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>{t("save")}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>{t("cancel")}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {editing === "new" ? form : (
        <Button variant="outline" onClick={() => {
          setFields(toFields());
          setEditing("new");
        }}><Plus /> {t("add")}</Button>
      )}
      {INSTRUMENT_GROUPS.map(group => {
        const members = order.filter(instrument => instrument.group === group);

        return members.length === 0 ? null : (
          <section key={group} className="space-y-2" aria-label={groups(group)}>
            <h2 className="font-semibold">{groups(group)}</h2>
            <ul className="divide-y rounded-lg border bg-card">
              {members.map((instrument, index) => (
                <li key={instrument.id} className="px-3 py-2">
                  {editing === instrument.id ? form : (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="font-medium">{localName(instrument, locale)}</p>
                        <p className="text-xs text-muted-foreground">
                          {[locale === "en" ? instrument.nameSv : instrument.nameEn,
                            t("defaultIn", { pitch: formatTransposition(instrument.defaultTransposition, locale) ?? "" }),
                            instrument.abbreviations.join(", "), t("uses", { count: instrument.useCount })].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="flex gap-0.5">
                        <Button size="icon-sm" variant="ghost" disabled={index === 0 || pending}
                                aria-label={t("moveUp", { name: instrument.nameSv })} onClick={() => move(instrument, -1)}><ArrowUp /></Button>
                        <Button size="icon-sm" variant="ghost" disabled={index === members.length - 1 || pending}
                                aria-label={t("moveDown", { name: instrument.nameSv })} onClick={() => move(instrument, 1)}><ArrowDown /></Button>
                        <Button size="icon-sm" variant="ghost" aria-label={t("edit", { name: instrument.nameSv })}
                                onClick={() => {
                                  setFields(toFields(instrument));
                                  setEditing(instrument.id);
                                }}><Pencil /></Button>
                        <Button size="icon-sm" variant="ghost" aria-label={t("merge", { name: instrument.nameSv })} onClick={async () => {
                          const into = await dialogs.choose({
                            title: t("mergeTitle", { name: localName(instrument, locale) }),
                            items: order.filter(other => other.id !== instrument.id).map(other => ({ id: other.id, label: localName(other, locale) })),
                          });

                          if (into) {
                            run(() => mergeInstrumentAction(instrument.id, into), t("merged"));
                          }
                        }}><GitMerge /></Button>
                        <Button size="icon-sm" variant="ghost" disabled={instrument.useCount > 0}
                                title={instrument.useCount > 0 ? t("inUse") : undefined}
                                aria-label={t("delete", { name: instrument.nameSv })} onClick={async () => {
                          if (await dialogs.confirm({ title: t("deleteTitle", { name: localName(instrument, locale) }), confirmLabel: t("deleteButton"), destructive: true })) {
                            run(() => deleteInstrumentAction(instrument.id), t("deleted"));
                          }
                        }}><Trash2 /></Button>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
