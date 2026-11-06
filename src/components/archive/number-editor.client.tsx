"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ClipboardPaste, GitMerge, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDialogs } from "@/components/dialogs.client";
import { useServerState } from "@/hooks/use-server-state.client";
import type { ActionResult } from "@/lib/graphql.server";
import {
  createNumberAction,
  deleteNumberAction,
  mergeNumberAction,
  pasteNumbersAction,
  reorderNumbersAction,
  updateNumberAction,
} from "@/app/(app)/manage/actions.server";
import { cn } from "@/utils/utils";

export type EditableNumber = {
  id: string;
  position: number;
  title: string;
  originalSong?: string | null;
  lyricist?: string | null;
  composer?: string | null;
  hasArrangement: boolean;
};

type Fields = { title: string; originalSong: string; lyricist: string; composer: string };

const toFields = (number?: EditableNumber): Fields => ({
  title: number?.title ?? "",
  originalSong: number?.originalSong ?? "",
  lyricist: number?.lyricist ?? "",
  composer: number?.composer ?? "",
});

/**
 * The numbers of a spex, kept by the archive's editors until Spexipedia takes them over: paste a list (one number per
 * line), add, edit, reorder by dragging (or with the arrows), delete a number without an arrangement, or merge one
 * that has one into another.
 */
export function NumberEditor({ spexId, numbers }: { spexId: string; numbers: EditableNumber[] }) {
  const t = useTranslations("Numbers");
  const router = useRouter();
  const dialogs = useDialogs();
  const [order, setOrder] = useServerState(numbers, list => list.map(number => `${number.id}:${number.title}`).join("|"));
  const [editing, setEditing] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields>(toFields());
  const [paste, setPaste] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<ActionResult<unknown>>, done?: string) => startTransition(async () => {
    const result = await work();

    if (result.ok) {
      if (done) {
        toast.success(done);
      }
      router.refresh();
    } else {
      toast.error(result.message);
      router.refresh();
    }
  });

  const save = (ids: string[]) => run(() => reorderNumbersAction(spexId, ids), t("reordered"));
  const move = (index: number, delta: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);

    next.splice(index + delta, 0, item);
    setOrder(next);
    save(next.map(number => number.id));
  };
  const drop = (targetId: string) => {
    if (!dragged || dragged === targetId) {
      return;
    }

    const next = order.filter(number => number.id !== dragged);
    const index = next.findIndex(number => number.id === targetId);

    next.splice(index, 0, order.find(number => number.id === dragged)!);
    setOrder(next);
    setDragged(null);
    save(next.map(number => number.id));
  };

  const remove = async (number: EditableNumber) => {
    if (number.hasArrangement) {
      return merge(number);
    }
    if (await dialogs.confirm({
      title: t("deleteTitle", { title: number.title }),
      description: t("deleteText"),
      confirmLabel: t("delete"),
      destructive: true,
    })) {
      run(() => deleteNumberAction(number.id), t("deleted"));
    }
  };

  const merge = async (number: EditableNumber) => {
    const into = await dialogs.choose({
      title: t("mergeTitle", { title: number.title }),
      items: order.filter(other => other.id !== number.id).map(other => ({ id: other.id, label: `${other.position}. ${other.title}` })),
    });

    if (into && await dialogs.confirm({
      title: t("mergeConfirm", { title: number.title }),
      description: t("mergeText"),
      confirmLabel: t("merge"),
      destructive: true,
    })) {
      run(() => mergeNumberAction(number.id, into), t("merged"));
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!fields.title.trim()) {
      return;
    }

    const id = editing;

    setEditing(null);
    run(() => id && id !== "new" ? updateNumberAction(id, fields) : createNumberAction(spexId, fields), t("saved"));
  };

  const form = (
    <form onSubmit={submit} className="grid gap-2 rounded-md border bg-muted/40 p-3 sm:grid-cols-2" aria-label={t("form")}>
      {(["title", "originalSong", "lyricist", "composer"] as const).map(name => (
        <div key={name} className="space-y-1">
          <Label htmlFor={`number-${name}`}>{t(`fields.${name}`)}</Label>
          <Input id={`number-${name}`} value={fields[name]} required={name === "title"} maxLength={255}
                 autoFocus={name === "title"}
                 onChange={event => setFields(current => ({ ...current, [name]: event.target.value }))} />
        </div>
      ))}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>{t("save")}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>{t("cancel")}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <ol className="divide-y rounded-lg border bg-card" aria-label={t("list")}>
        {order.map((number, index) => (
          <li key={number.id}
              draggable={editing === null}
              onDragStart={() => setDragged(number.id)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => drop(number.id)}
              onDragEnd={() => setDragged(null)}
              className={cn("px-2 py-2", dragged === number.id && "opacity-50")}
              data-testid="number-row">
            {editing === number.id ? form : (
              <div className="flex flex-wrap items-center gap-2">
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
                <span className="w-6 text-right text-sm tabular-nums text-muted-foreground">{index + 1}.</span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium">{number.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[number.originalSong, [number.lyricist, number.composer].filter(Boolean).join(" / "),
                      number.hasArrangement ? t("hasArrangement") : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="flex shrink-0 gap-0.5">
                  <Button size="icon-sm" variant="ghost" disabled={index === 0 || pending}
                          aria-label={t("moveUp", { title: number.title })} onClick={() => move(index, -1)}><ArrowUp /></Button>
                  <Button size="icon-sm" variant="ghost" disabled={index === order.length - 1 || pending}
                          aria-label={t("moveDown", { title: number.title })} onClick={() => move(index, 1)}><ArrowDown /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t("edit", { title: number.title })}
                          onClick={() => {
                            setFields(toFields(number));
                            setEditing(number.id);
                          }}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t("mergeOf", { title: number.title })}
                          onClick={() => merge(number)}><GitMerge /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t("deleteOf", { title: number.title })}
                          title={number.hasArrangement ? t("cannotDelete") : undefined}
                          disabled={number.hasArrangement}
                          onClick={() => remove(number)}><Trash2 /></Button>
                </span>
              </div>
            )}
          </li>
        ))}
        {order.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t("none")}</li>}
      </ol>

      {editing === "new" ? form : (
        <Button variant="outline" onClick={() => {
          setFields(toFields());
          setEditing("new");
        }}><Plus /> {t("add")}</Button>
      )}

      <form className="space-y-2" onSubmit={event => {
        event.preventDefault();
        if (paste.trim()) {
          const text = paste;

          setPaste("");
          run(() => pasteNumbersAction(spexId, text), t("pasted"));
        }
      }}>
        <Label htmlFor="numbers-paste">{t("paste")}</Label>
        <p className="text-xs text-muted-foreground">{t("pasteHint")}</p>
        <Textarea id="numbers-paste" rows={6} value={paste} onChange={event => setPaste(event.target.value)}
                  placeholder={t("pastePlaceholder")} className="font-mono text-sm" />
        <Button type="submit" variant="outline" disabled={pending || !paste.trim()}><ClipboardPaste /> {t("pasteButton")}</Button>
      </form>
    </div>
  );
}
