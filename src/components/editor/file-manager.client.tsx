"use client";

import * as React from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FileUp, GripVertical, Pencil, Replace, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useDialogs } from "@/components/dialogs.client";
import { useServerState } from "@/hooks/use-server-state.client";
import { InstrumentsPicker, type PickerInstrument, TranspositionPicker } from "@/components/editor/pickers.client";
import { ShareLinkButton } from "@/components/archive/share-link-dialog.client";
import { uploadFile } from "@/components/upload/tus.client";
import {
  addFileAction,
  deleteFileAction,
  fileGuessAction,
  reorderFilesAction,
  replaceFileAction,
  updateFileAction,
} from "@/app/(app)/manage/actions.server";
import { formatBytes } from "@/utils/links";
import { formatTransposition, localName, type Transposition } from "@/utils/music";
import { track } from "@/utils/umami";
import { cn } from "@/utils/utils";

export type ManagedFile = {
  id: string;
  title: string;
  comment?: string | null;
  name: string;
  size: number;
  pages?: number | null;
  processing: string;
  role: { id: string; nameSv: string; nameEn: string };
  instruments: { id: string; nameSv: string; nameEn: string }[];
  desk?: string | null;
  transposition?: Transposition | null;
  downloadCount?: number | null;
};

type Role = { id: string; nameSv: string; nameEn: string };

type Meta = {
  title: string;
  comment: string;
  roleId: string;
  instrumentIds: string[];
  desk: string;
  transposition: Transposition | null;
  /** Whether the editor chose the transposition, so that changing the first instrument no longer sets it. */
  transpositionChosen: boolean;
};

type Pending = {
  key: string;
  file: File;
  progress: number;
  uploadId: string | null;
  error: string | null;
  guessed: boolean;
  meta: Meta;
};

const toMeta = (file: ManagedFile): Meta => ({
  title: file.title,
  comment: file.comment ?? "",
  roleId: file.role.id,
  instrumentIds: file.instruments.map(instrument => instrument.id),
  desk: file.desk ?? "",
  transposition: file.transposition ? { pitch: file.transposition.pitch, octave: file.transposition.octave } : null,
  transpositionChosen: true,
});

/**
 * A file's role, instruments (in order), desk and transposition, title and comment. A new part's transposition follows
 * its first instrument's default until the editor picks one.
 */
function MetaFields({ meta, onChange, roles, instruments, idPrefix }: {
  meta: Meta;
  onChange: (meta: Meta) => void;
  roles: Role[];
  instruments: PickerInstrument[];
  idPrefix: string;
}) {
  const t = useTranslations("FileManager");
  const locale = useLocale();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-title`}>{t("fileTitle")}</Label>
        <Input id={`${idPrefix}-title`} value={meta.title} maxLength={255}
               onChange={event => onChange({ ...meta, title: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-role`}>{t("role")}</Label>
        <NativeSelect id={`${idPrefix}-role`} value={meta.roleId} className="w-full"
                      onChange={event => onChange({ ...meta, roleId: event.target.value })}>
          {roles.map(role => <NativeSelectOption key={role.id} value={role.id}>{localName(role, locale)}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-instruments`}>{t("instruments")}</Label>
        <InstrumentsPicker id={`${idPrefix}-instruments`} instruments={instruments} value={meta.instrumentIds}
                           onChange={ids => {
                             const first = instruments.find(instrument => instrument.id === ids[0]);

                             onChange({
                               ...meta,
                               instrumentIds: ids,
                               transposition: meta.transpositionChosen || !first
                                 ? meta.transposition
                                 : { pitch: first.defaultTransposition.pitch, octave: first.defaultTransposition.octave },
                             });
                           }} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-desk`}>{t("desk")}</Label>
        <Input id={`${idPrefix}-desk`} value={meta.desk} maxLength={50} placeholder={t("deskPlaceholder")}
               onChange={event => onChange({ ...meta, desk: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-transposition`}>{t("transposition")}</Label>
        <TranspositionPicker id={`${idPrefix}-transposition`} value={meta.transposition}
                             onChange={transposition => onChange({ ...meta, transposition, transpositionChosen: true })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-comment`}>{t("comment")}</Label>
        <Input id={`${idPrefix}-comment`} value={meta.comment} maxLength={1000}
               onChange={event => onChange({ ...meta, comment: event.target.value })} />
      </div>
    </div>
  );
}

/**
 * A version's files for editors: upload by dragging files here or choosing them (resumable, in chunks), with the role,
 * instruments, desk and transposition guessed from each name and editable before the file is added; edit, reorder by
 * dragging, replace and delete the files; and share chosen files with a link.
 */
export function FileManager({ versionId, files, roles, instruments, maxUploadMb, maxShareLinkMonths, shareName }: {
  versionId: string;
  files: ManagedFile[];
  roles: Role[];
  instruments: PickerInstrument[];
  maxUploadMb: number;
  maxShareLinkMonths: number;
  shareName: string;
}) {
  const t = useTranslations("FileManager");
  const locale = useLocale();
  const router = useRouter();
  const dialogs = useDialogs();
  const [order, setOrder] = useServerState(files, list => list.map(file =>
    `${file.id}:${file.title}:${file.role.id}:${file.instruments.map(i => i.id).join(",")}:${file.desk}:${file.transposition?.pitch}${file.transposition?.octave}`).join("|"));
  const [pending, setPending] = useState<Pending[]>([]);
  const [editing, setEditing] = useState<{ id: string; meta: Meta } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [busy, startTransition] = useTransition();
  const replaceInput = useRef<HTMLInputElement>(null);
  const replacing = useRef<string | null>(null);
  const defaultRole = roles[0]?.id ?? "";

  const update = (key: string, change: Partial<Pending>) =>
    setPending(list => list.map(item => (item.key === key ? { ...item, ...change } : item)));

  const accept = (chosen: FileList | File[]) => {
    for (const file of Array.from(chosen)) {
      if (file.size > maxUploadMb * 1024 * 1024) {
        toast.error(t("tooLarge", { name: file.name, max: maxUploadMb }));
        continue;
      }

      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const meta: Meta = {
        title: file.name.replace(/\.[^.]+$/, ""), comment: "", roleId: defaultRole, instrumentIds: [], desk: "",
        transposition: null, transpositionChosen: false,
      };

      setPending(list => [...list, { key, file, progress: 0, uploadId: null, error: null, guessed: false, meta }]);
      void fileGuessAction(versionId, file.name).then(result => {
        if (result.ok && result.data) {
          const guess = result.data;

          setPending(list => list.map(item => (item.key === key && !item.guessed ? {
            ...item,
            guessed: true,
            meta: {
              ...item.meta,
              title: guess.title || item.meta.title,
              roleId: guess.role.id,
              instrumentIds: guess.instruments.map(instrument => instrument.id),
              desk: guess.desk ?? "",
              transposition: guess.transposition ? { pitch: guess.transposition.pitch, octave: guess.transposition.octave } : null,
            },
          } : item)));
        }
      });
      uploadFile(file, progress => update(key, { progress })).then(
        uploadId => update(key, { uploadId, progress: 1 }),
        error => update(key, { error: error instanceof Error ? error.message : String(error) }),
      );
    }
  };

  const add = (item: Pending) => startTransition(async () => {
    if (!item.uploadId) {
      return;
    }

    const result = await addFileAction(versionId, item.uploadId, {
      title: item.meta.title,
      comment: item.meta.comment,
      roleId: item.meta.roleId,
      instrumentIds: item.meta.instrumentIds,
      desk: item.meta.desk,
      transposition: item.meta.transposition,
    });

    if (result.ok) {
      track("file-upload", { instruments: item.meta.instrumentIds.length });
      setPending(list => list.filter(other => other.key !== item.key));
      toast.success(t("added", { title: item.meta.title }));
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  const saveEdit = () => startTransition(async () => {
    if (!editing) {
      return;
    }

    const { id, meta } = editing;
    const result = await updateFileAction(id, {
      title: meta.title,
      comment: meta.comment,
      roleId: meta.roleId,
      instrumentIds: meta.instrumentIds,
      desk: meta.desk,
      transposition: meta.transposition,
    });

    if (result.ok) {
      toast.success(t("saved"));
      setEditing(null);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  const reorder = (next: ManagedFile[]) => {
    setOrder(next);
    startTransition(async () => {
      const result = await reorderFilesAction(versionId, next.map(file => file.id));

      if (!result.ok) {
        toast.error(result.message);
      }
      router.refresh();
    });
  };
  const move = (index: number, delta: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);

    next.splice(index + delta, 0, item);
    reorder(next);
  };
  const drop = (targetId: string) => {
    if (!dragged || dragged === targetId) {
      return;
    }

    const next = order.filter(file => file.id !== dragged);

    next.splice(next.findIndex(file => file.id === targetId), 0, order.find(file => file.id === dragged)!);
    setDragged(null);
    reorder(next);
  };

  const remove = async (file: ManagedFile) => {
    if (await dialogs.confirm({ title: t("deleteTitle", { title: file.title }), description: t("deleteText"), confirmLabel: t("delete"), destructive: true })) {
      startTransition(async () => {
        const result = await deleteFileAction(file.id);

        if (result.ok) {
          toast.success(t("deleted"));
          router.refresh();
        } else {
          toast.error(result.message);
        }
      });
    }
  };

  const replace = (file: File) => {
    const id = replacing.current;

    if (!id) {
      return;
    }
    toast.info(t("replacing", { name: file.name }));
    uploadFile(file, () => undefined).then(uploadId => startTransition(async () => {
      const result = await replaceFileAction(id, uploadId);

      if (result.ok) {
        toast.success(t("replaced"));
        router.refresh();
      } else {
        toast.error(result.message);
      }
    }), error => toast.error(error instanceof Error ? error.message : String(error)));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={event => {
          if (event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={event => {
          if (event.dataTransfer.files.length > 0) {
            event.preventDefault();
            setOver(false);
            accept(event.dataTransfer.files);
          }
        }}
        className={cn("flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center",
          over ? "border-primary bg-primary/5" : "border-border")}
        data-testid="drop-zone">
        <FileUp className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm">{t("drop")}</p>
        <p className="text-xs text-muted-foreground">{t("formats", { max: maxUploadMb })}</p>
        <Label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          <Upload className="size-4" /> {t("choose")}
          <input type="file" multiple className="sr-only" data-testid="file-input"
                 onChange={event => {
                   if (event.target.files) {
                     accept(event.target.files);
                   }
                   event.target.value = "";
                 }} />
        </Label>
      </div>

      {pending.length > 0 && (
        <section aria-label={t("uploads")} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{t("uploads")}</h3>
            {pending.length > 1 && (
              <Button size="sm" disabled={busy || pending.some(item => !item.uploadId)}
                      onClick={() => pending.forEach(add)}>{t("addAll")}</Button>
            )}
          </div>
          {pending.map(item => (
            <div key={item.key} className="space-y-3 rounded-lg border p-3" data-testid="pending-upload">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{item.file.name}</span>
                <span className="text-muted-foreground">
                  {item.error ? <span className="text-destructive">{t("failed")}</span>
                    : item.uploadId ? t("uploaded") : t("progress", { percent: Math.round(item.progress * 100) })}
                </span>
              </div>
              <progress value={item.progress} max={1} className="h-1.5 w-full accent-primary" aria-label={t("progressOf", { name: item.file.name })} />
              <MetaFields meta={item.meta} roles={roles} instruments={instruments} idPrefix={`pending-${item.key.replace(/\W/g, "")}`}
                          onChange={meta => update(item.key, { meta, guessed: true })} />
              <div className="flex gap-2">
                <Button size="sm" disabled={busy || !item.uploadId || !item.meta.title.trim()} onClick={() => add(item)}>{t("add")}</Button>
                <Button size="sm" variant="outline" onClick={() => setPending(list => list.filter(other => other.key !== item.key))}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <input ref={replaceInput} type="file" className="sr-only" aria-hidden tabIndex={-1} onChange={event => {
        const file = event.target.files?.[0];

        if (file) {
          replace(file);
        }
        event.target.value = "";
      }} />

      {order.length === 0 ? <p className="text-sm text-muted-foreground">{t("none")}</p> : (
        <ol className="divide-y rounded-lg border bg-card" aria-label={t("files")}>
          {order.map((file, index) => (
            <li key={file.id} draggable={!editing}
                onDragStart={event => {
                  event.dataTransfer.setData("text/plain", file.id);
                  setDragged(file.id);
                }}
                onDragOver={event => dragged && event.preventDefault()}
                onDrop={event => {
                  if (dragged) {
                    event.preventDefault();
                    drop(file.id);
                  }
                }}
                onDragEnd={() => setDragged(null)}
                className={cn("space-y-3 px-2 py-2", dragged === file.id && "opacity-50")} data-testid="managed-file">
              <div className="flex flex-wrap items-center gap-2">
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
                <Checkbox className="relative after:absolute after:-inset-3" checked={selected.includes(file.id)} aria-label={t("select", { title: file.title })}
                          onCheckedChange={checked => setSelected(list => checked === true ? [...list, file.id] : list.filter(id => id !== file.id))} />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-medium">{file.title}</p>
                  <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <Badge variant="outline">{localName(file.role, locale)}</Badge>
                    {file.instruments.map(instrument => localName(instrument, locale)).join(" / ")}
                    {file.desk ? ` ${file.desk}` : ""}
                    {file.transposition && <Badge variant="secondary">{formatTransposition(file.transposition, locale)}</Badge>}
                    <span>{file.name} · {formatBytes(file.size, locale)}</span>
                    {file.processing !== "DONE" && <span>· {t(`processing.${file.processing}`)}</span>}
                    {typeof file.downloadCount === "number" && <span>· {t("downloads", { count: file.downloadCount })}</span>}
                  </p>
                </div>
                <span className="flex shrink-0 gap-0.5">
                  <Button size="icon-sm" variant="ghost" disabled={index === 0 || busy} aria-label={t("moveUp", { title: file.title })}
                          onClick={() => move(index, -1)}><ArrowUp /></Button>
                  <Button size="icon-sm" variant="ghost" disabled={index === order.length - 1 || busy}
                          aria-label={t("moveDown", { title: file.title })} onClick={() => move(index, 1)}><ArrowDown /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t("edit", { title: file.title })}
                          onClick={() => setEditing(editing?.id === file.id ? null : { id: file.id, meta: toMeta(file) })}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t("replace", { title: file.title })}
                          onClick={() => {
                            replacing.current = file.id;
                            replaceInput.current?.click();
                          }}><Replace /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={t("deleteOf", { title: file.title })}
                          onClick={() => remove(file)}><Trash2 /></Button>
                </span>
              </div>
              {editing?.id === file.id && (
                <form className="space-y-3 rounded-md bg-muted/40 p-3" aria-label={t("editForm", { title: file.title })}
                      onSubmit={event => {
                        event.preventDefault();
                        saveEdit();
                      }}>
                  <MetaFields meta={editing.meta} roles={roles} instruments={instruments} idPrefix={`file-${file.id}`}
                              onChange={meta => setEditing({ id: file.id, meta })} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={busy || !editing.meta.title.trim()}>{t("save")}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>{t("cancel")}</Button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ol>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("selected", { count: selected.length })}</span>
          <ShareLinkButton input={{ fileIds: selected }} defaultName={shareName} maxMonths={maxShareLinkMonths}
                           label={t("shareSelected")} />
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>{t("clearSelection")}</Button>
        </div>
      )}
    </div>
  );
}
