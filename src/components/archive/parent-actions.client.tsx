"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { Button } from "@bloomper/fgv-web-ui/ui/button";
import { Input } from "@bloomper/fgv-web-ui/ui/input";
import { Label } from "@bloomper/fgv-web-ui/ui/label";
import { Textarea } from "@bloomper/fgv-web-ui/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@bloomper/fgv-web-ui/ui/native-select";
import { type PickedSpex, SpexPicker } from "@/components/spex/spex-picker.client";
import { useDialogs } from "@bloomper/fgv-web-ui/shell/dialogs";
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
 * An editor's actions on a document or an arrangement: a new version, editing its fields, and the trash, which takes
 * its versions with it. A document's kind can be changed, and it can be filed under a spex, or another one; the server
 * cannot take it from its spex, so one with a spex keeps one.
 */
export function ParentActions({
  kind,
  id,
  trashed,
  fields,
  spexHref,
  kinds = [],
}: {
  kind: Kind;
  id: string;
  trashed: boolean;
  fields: {
    title?: string;
    authors?: string | null;
    description?: string | null;
    /** A document's kind. */
    kindId?: string;
    /** A document's spex; null for FGV's own. */
    spex?: PickedSpex | null;
    /** A book's number in its series and year (spec 4.7). */
    volume?: number | null;
    publishedYear?: string | null;
  };
  /** Where to go once it is in the trash. */
  spexHref: string;
  /** The kinds a document may be given; a book kind gives it a volume, a year and songs. */
  kinds?: { id: string; name: string; book?: boolean }[];
}) {
  const t = useTranslations("ParentActions");
  const router = useRouter();
  const dialogs = useDialogs();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useServerState(fields.title ?? "");
  const [authors, setAuthors] = useServerState(fields.authors ?? "");
  const [description, setDescription] = useServerState(fields.description ?? "");
  const [kindId, setKindId] = useServerState(fields.kindId ?? "");
  const [volume, setVolume] = useServerState(fields.volume ? String(fields.volume) : "");
  const [publishedYear, setPublishedYear] = useServerState(fields.publishedYear ?? "");
  const book = kinds.find((option) => option.id === kindId)?.book ?? false;
  const [spex, setSpex] = useServerState(fields.spex ?? null, (value) => value?.id ?? null);
  // A document with a spex cannot be made FGV's own again
  const spexMissing = Boolean(fields.spex) && !spex;
  const [pending, startTransition] = useTransition();

  const newVersion = async () => {
    const label = await dialogs.prompt({
      title: t("newVersion"),
      label: t("label"),
      confirmLabel: t("create"),
      maxLength: 200,
    });

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
    if (
      !trashed &&
      !(await dialogs.confirm({
        title: kind === "MANUSCRIPT" ? t("trashManuscript") : t("trashArrangement"),
        description: t("trashText"),
        confirmLabel: t("toTrash"),
        destructive: true,
      }))
    ) {
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

  const save = () =>
    startTransition(async () => {
      const result =
        kind === "MANUSCRIPT"
          ? await updateManuscriptAction(id, {
              title,
              authors: authors || null,
              description: description || null,
              kindId: kindId && kindId !== fields.kindId ? kindId : undefined,
              spexId: spex && spex.id !== fields.spex?.id ? spex.id : undefined,
              // Only a book has a volume and a year
              volume: book ? (volume ? Number(volume) : null) : undefined,
              publishedYear: book ? publishedYear.trim() || null : undefined,
            })
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
        <Button
          size="sm"
          onClick={newVersion}
          disabled={pending || trashed}
        >
          <Plus /> {t("newVersion")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing((open) => !open)}
          aria-expanded={editing}
        >
          <Pencil /> {kind === "MANUSCRIPT" ? t("editManuscript") : t("editArrangement")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={trash}
          disabled={pending}
        >
          {trashed ? (
            <>
              <Undo2 /> {t("restore")}
            </>
          ) : (
            <>
              <Trash2 /> {t("toTrash")}
            </>
          )}
        </Button>
      </div>
      {editing && (
        <form
          className="grid max-w-2xl gap-3 rounded-lg border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          {kind === "MANUSCRIPT" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="parent-title">{t("title")}</Label>
                <Input
                  id="parent-title"
                  value={title}
                  required
                  maxLength={255}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parent-authors">{t("authors")}</Label>
                <Input
                  id="parent-authors"
                  value={authors}
                  maxLength={500}
                  onChange={(event) => setAuthors(event.target.value)}
                />
              </div>
              {kinds.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="parent-kind">{t("kind")}</Label>
                  <NativeSelect
                    id="parent-kind"
                    value={kindId}
                    className="w-full"
                    onChange={(event) => setKindId(event.target.value)}
                  >
                    {kinds.map((option) => (
                      <NativeSelectOption
                        key={option.id}
                        value={option.id}
                      >
                        {option.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {book && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="parent-volume">{t("volume")}</Label>
                    <Input
                      id="parent-volume"
                      type="number"
                      min={1}
                      value={volume}
                      onChange={(event) => setVolume(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parent-published">{t("publishedYear")}</Label>
                    <Input
                      id="parent-published"
                      value={publishedYear}
                      maxLength={10}
                      placeholder="1975"
                      pattern="\d{4}(-\d{2}(-\d{2})?)?"
                      onChange={(event) => setPublishedYear(event.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <SpexPicker
                  value={spex}
                  onChange={setSpex}
                  originalsOnly
                />
                <p className="text-muted-foreground text-xs">{fields.spex ? t("spexKept") : t("noSpex")}</p>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="parent-description">{t("description")}</Label>
            <Textarea
              id="parent-description"
              value={description}
              rows={4}
              maxLength={10000}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={pending || spexMissing}
            >
              {t("save")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
