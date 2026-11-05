"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDialogs } from "@/components/dialogs.client";
import { useServerState } from "@/hooks/use-server-state.client";
import {
  createVersionAction,
  trashParentAction,
  updateArrangementAction,
  updateManuscriptAction,
} from "@/app/(app)/manage/actions.server";
import { versionEditHref } from "@/utils/links";

type Kind = "MANUSCRIPT" | "ARRANGEMENT";

/**
 * An editor's actions on a manuscript or an arrangement: a new version, editing its fields, and the trash, which takes
 * its versions with it.
 */
export function ParentActions({ kind, id, trashed, fields, spexHref }: {
  kind: Kind;
  id: string;
  trashed: boolean;
  fields: { title?: string; authors?: string | null; description?: string | null };
  /** Where to go once it is in the trash. */
  spexHref: string;
}) {
  const t = useTranslations("ParentActions");
  const router = useRouter();
  const dialogs = useDialogs();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useServerState(fields.title ?? "");
  const [authors, setAuthors] = useServerState(fields.authors ?? "");
  const [description, setDescription] = useServerState(fields.description ?? "");
  const [pending, startTransition] = useTransition();

  const newVersion = async () => {
    const label = await dialogs.prompt({ title: t("newVersion"), label: t("label"), confirmLabel: t("create"), maxLength: 200 });

    if (label) {
      startTransition(async () => {
        const result = await createVersionAction(id, { label });

        if (result.ok && result.data) {
          router.push(versionEditHref(result.data));
        } else if (!result.ok) {
          toast.error(result.message);
        }
      });
    }
  };

  const trash = async () => {
    if (!trashed && !await dialogs.confirm({
      title: kind === "MANUSCRIPT" ? t("trashManuscript") : t("trashArrangement"),
      description: t("trashText"),
      confirmLabel: t("toTrash"),
      destructive: true,
    })) {
      return;
    }
    startTransition(async () => {
      const result = await trashParentAction(kind, id, !trashed);

      if (result.ok) {
        toast.success(trashed ? t("restored") : t("trashed"));
        if (trashed) {
          router.refresh();
        } else {
          router.push(spexHref);
        }
      } else {
        toast.error(result.message);
      }
    });
  };

  const save = () => startTransition(async () => {
    const result = kind === "MANUSCRIPT"
      ? await updateManuscriptAction(id, { title, authors: authors || null, description: description || null })
      : await updateArrangementAction(id, description || null);

    if (result.ok) {
      toast.success(t("saved"));
      setEditing(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={newVersion} disabled={pending || trashed}><Plus /> {t("newVersion")}</Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(open => !open)} aria-expanded={editing}>
          <Pencil /> {kind === "MANUSCRIPT" ? t("editManuscript") : t("editArrangement")}
        </Button>
        <Button size="sm" variant="outline" onClick={trash} disabled={pending}>
          {trashed ? <><Undo2 /> {t("restore")}</> : <><Trash2 /> {t("toTrash")}</>}
        </Button>
      </div>
      {editing && (
        <form className="grid max-w-2xl gap-3 rounded-lg border p-3" onSubmit={event => {
          event.preventDefault();
          save();
        }}>
          {kind === "MANUSCRIPT" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="parent-title">{t("title")}</Label>
                <Input id="parent-title" value={title} required maxLength={255} onChange={event => setTitle(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parent-authors">{t("authors")}</Label>
                <Input id="parent-authors" value={authors} maxLength={500} onChange={event => setAuthors(event.target.value)} />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="parent-description">{t("description")}</Label>
            <Textarea id="parent-description" value={description} rows={4} maxLength={10000}
                      onChange={event => setDescription(event.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{t("save")}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>{t("cancel")}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
