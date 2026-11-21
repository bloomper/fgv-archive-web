"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { type PickedSpex, SpexPicker } from "@/components/spex/spex-picker.client";
import { useServerState } from "@/hooks/use-server-state.client";
import { setBookSongsAction, spexNumbersAction } from "@/app/(app)/manage/actions.server";
import { spexName } from "@/utils/links";

/** A song of a book as the editor holds it: a number from Spexipedia (with a label to show) or a free title. */
export type EditorSong = { numberId?: string | null; label: string; title?: string | null; textOnly: boolean };

type SpexNumber = { id: string; act: number; position: number; title: string };

/**
 * A book's songs in the book's order (spec 4.7): numbers of any spex, picked by spex and title, or free titles for
 * songs that are no number. A number that is missing is added in Spexipedia first.
 */
export function BookSongsEditor({ bookId, songs }: { bookId: string; songs: EditorSong[] }) {
  const t = useTranslations("BookSongs");
  const router = useRouter();
  const [list, setList] = useServerState(songs, value => JSON.stringify(value));
  const [spex, setSpex] = useState<PickedSpex | null>(null);
  const [numbers, setNumbers] = useState<SpexNumber[]>([]);
  const [numberId, setNumberId] = useState("");
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const pickSpex = (picked: PickedSpex | null) => {
    setSpex(picked);
    setNumbers([]);
    setNumberId("");
    if (picked) {
      startTransition(async () => {
        const result = await spexNumbersAction(picked.id);

        if (result.ok) {
          setNumbers(result.data ?? []);
        } else {
          toast.error(result.message);
        }
      });
    }
  };

  const addNumber = () => {
    const number = numbers.find(candidate => candidate.id === numberId);

    if (number) {
      setList([...list, { numberId: number.id, label: `${number.title} (${spexName(spex)})`, textOnly: false }]);
      setNumberId("");
    }
  };

  const move = (index: number, by: number) => {
    const next = [...list];

    [next[index], next[index + by]] = [next[index + by], next[index]];
    setList(next);
  };

  const save = () => startTransition(async () => {
    const result = await setBookSongsAction(bookId, list.map(song => ({
      numberId: song.numberId ?? null, title: song.numberId ? null : song.title ?? song.label, textOnly: song.textOnly,
    })));

    if (result.ok) {
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">{t("editTitle")}</h3>
      <p className="text-xs text-muted-foreground">{t("help")}</p>
      {list.length > 0 && (
        <ol className="divide-y rounded-md border">
          {list.map((song, index) => (
            <li key={`${song.numberId ?? song.title}-${index}`} className="flex flex-wrap items-center gap-2 px-3 py-1.5 text-sm">
              <span className="w-6 tabular-nums text-muted-foreground">{index + 1}.</span>
              <span className="min-w-0 flex-1">{song.label}{!song.numberId && <span className="text-muted-foreground"> ({t("freeTitle")})</span>}</span>
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox checked={song.textOnly} aria-label={t("textOnlyOf", { title: song.label })}
                          onCheckedChange={checked => setList(list.map((other, i) => i === index ? { ...other, textOnly: checked === true } : other))} />
                {t("textOnly")}
              </label>
              <Button size="icon-sm" variant="ghost" disabled={index === 0} aria-label={t("moveUp", { title: song.label })}
                      onClick={() => move(index, -1)}><ArrowUp /></Button>
              <Button size="icon-sm" variant="ghost" disabled={index === list.length - 1} aria-label={t("moveDown", { title: song.label })}
                      onClick={() => move(index, 1)}><ArrowDown /></Button>
              <Button size="icon-sm" variant="ghost" aria-label={t("remove", { title: song.label })}
                      onClick={() => setList(list.filter((_, i) => i !== index))}><Trash2 /></Button>
            </li>
          ))}
        </ol>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <SpexPicker value={spex} onChange={pickSpex} />
          {spex && (
            <div className="flex gap-2">
              <NativeSelect aria-label={t("number")} value={numberId} className="w-full" onChange={event => setNumberId(event.target.value)}>
                <NativeSelectOption value="">{numbers.length === 0 ? t("noNumbers") : t("pickNumber")}</NativeSelectOption>
                {numbers.map(number => (
                  <NativeSelectOption key={number.id} value={number.id}>{`${number.act}:${number.position} ${number.title}`}</NativeSelectOption>
                ))}
              </NativeSelect>
              <Button type="button" variant="outline" disabled={!numberId} onClick={addNumber}><Plus />{t("add")}</Button>
            </div>
          )}
        </div>
        <form className="space-y-1.5" onSubmit={event => {
          event.preventDefault();
          if (title.trim()) {
            setList([...list, { label: title.trim(), title: title.trim(), textOnly: false }]);
            setTitle("");
          }
        }}>
          <Label htmlFor="book-free-title">{t("freeTitleLabel")}</Label>
          <div className="flex gap-2">
            <Input id="book-free-title" value={title} maxLength={255} onChange={event => setTitle(event.target.value)} />
            <Button type="submit" variant="outline" disabled={!title.trim()}><Plus />{t("add")}</Button>
          </div>
        </form>
      </div>
      <Button size="sm" disabled={pending} onClick={save}>{t("save")}</Button>
    </div>
  );
}
