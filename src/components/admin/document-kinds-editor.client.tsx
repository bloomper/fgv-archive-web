"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, GitMerge, Pencil, Plus } from "lucide-react";
import { Badge } from "@bloomper/fgv-web-ui/ui/badge";
import { Button } from "@bloomper/fgv-web-ui/ui/button";
import { Input } from "@bloomper/fgv-web-ui/ui/input";
import { Label } from "@bloomper/fgv-web-ui/ui/label";
import { Textarea } from "@bloomper/fgv-web-ui/ui/textarea";
import { Checkbox } from "@bloomper/fgv-web-ui/ui/checkbox";
import { useDialogs } from "@bloomper/fgv-web-ui/shell/dialogs";
import { useServerState } from "@/hooks/use-server-state.client";
import type { ActionResult } from "@/lib/graphql.server";
import { kindIcon, parseAliases } from "@/utils/document-kinds";
import { localName } from "@/utils/music";
import {
  mergeDocumentKindAction,
  reorderDocumentKindsAction,
  retireDocumentKindAction,
  saveDocumentKindAction,
} from "@/app/(app)/admin/actions.server";

export type AdminDocumentKind = {
  id: string;
  nameSv: string;
  nameEn: string;
  aliases: string[];
  position: number;
  retired: boolean;
  documentCount: number;
  /** Whether its documents are books with a song list (spec 4.7). */
  book: boolean;
};

type Fields = { nameSv: string; nameEn: string; aliases: string; book: boolean };

const toFields = (kind?: AdminDocumentKind): Fields => ({
  nameSv: kind?.nameSv ?? "",
  nameEn: kind?.nameEn ?? "",
  aliases: kind?.aliases.join("\n") ?? "",
  book: kind?.book ?? false,
});

/**
 * The document kinds in order, with Swedish and English names and the aliases the import knows them by. A kind is not
 * deleted: it is retired (kept on its documents, not offered for new ones) or merged into another, which takes its
 * documents and keeps its names as aliases.
 */
export function DocumentKindsEditor({ kinds }: { kinds: AdminDocumentKind[] }) {
  const t = useTranslations("AdminDocumentKinds");
  const locale = useLocale();
  const router = useRouter();
  const dialogs = useDialogs();
  const [order, setOrder] = useServerState(kinds, (list) =>
    list
      .map(
        (kind) =>
          `${kind.id}:${kind.position}:${kind.nameSv}:${kind.nameEn}:${kind.aliases.join(",")}:${kind.retired}:${kind.documentCount}:${kind.book}`
      )
      .join("|")
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields>(toFields());
  const [pending, startTransition] = useTransition();
  const active = order.filter((kind) => !kind.retired).length;

  const run = (work: () => Promise<ActionResult<unknown>>, done: string) =>
    startTransition(async () => {
      const result = await work();

      if (result.ok) {
        toast.success(done);
      } else {
        toast.error(result.message);
      }
      router.refresh();
    });

  const move = (index: number, delta: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);

    next.splice(index + delta, 0, item);
    setOrder(next);
    run(() => reorderDocumentKindsAction(next.map((kind) => kind.id)), t("reordered"));
  };

  const merge = async (kind: AdminDocumentKind) => {
    const intoId = await dialogs.choose({
      title: t("mergeTitle", { name: localName(kind, locale) }),
      items: order
        .filter((other) => other.id !== kind.id)
        .map((other) => ({ id: other.id, label: localName(other, locale) })),
    });
    const into = order.find((other) => other.id === intoId);

    if (
      into &&
      (await dialogs.confirm({
        title: t("mergeConfirm", { name: localName(kind, locale), into: localName(into, locale) }),
        description: t("mergeText", { count: kind.documentCount, into: localName(into, locale) }),
        confirmLabel: t("mergeButton"),
        destructive: true,
      }))
    ) {
      run(() => mergeDocumentKindAction(kind.id, into.id), t("merged"));
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const id = editing;
    const input = {
      nameSv: fields.nameSv,
      nameEn: fields.nameEn,
      aliases: parseAliases(fields.aliases),
      book: fields.book,
    };

    setEditing(null);
    run(() => saveDocumentKindAction(id && id !== "new" ? id : null, input), t("saved"));
  };

  const form = (
    <form
      onSubmit={submit}
      className="bg-muted/40 grid gap-3 rounded-md border p-3 sm:grid-cols-2"
      aria-label={t("form")}
    >
      <div className="space-y-1">
        <Label htmlFor="kind-sv">{t("nameSv")}</Label>
        <Input
          id="kind-sv"
          value={fields.nameSv}
          required
          maxLength={100}
          onChange={(event) => setFields({ ...fields, nameSv: event.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="kind-en">{t("nameEn")}</Label>
        <Input
          id="kind-en"
          value={fields.nameEn}
          required
          maxLength={100}
          onChange={(event) => setFields({ ...fields, nameEn: event.target.value })}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="kind-aliases">{t("aliases")}</Label>
        <Textarea
          id="kind-aliases"
          value={fields.aliases}
          rows={3}
          aria-describedby="kind-aliases-help"
          onChange={(event) => setFields({ ...fields, aliases: event.target.value })}
        />
        <p
          id="kind-aliases-help"
          className="text-muted-foreground text-xs"
        >
          {t("aliasesHint")}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox
          checked={fields.book}
          onCheckedChange={(checked) => setFields({ ...fields, book: checked === true })}
        />
        {t("book")}
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
        >
          {t("save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditing(null)}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <ul
        className="bg-card divide-y rounded-lg border"
        aria-label={t("list")}
      >
        {order.map((kind, index) => {
          const Icon = kindIcon(kind);
          const name = localName(kind, locale);

          return (
            <li
              key={kind.id}
              className="px-3 py-2"
            >
              {editing === kind.id ? (
                form
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Icon
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {name}
                      {kind.retired && <Badge variant="secondary">{t("retired")}</Badge>}
                      {kind.book && <Badge variant="outline">{t("bookBadge")}</Badge>}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {[
                        locale === "en" ? kind.nameSv : kind.nameEn,
                        kind.aliases.join(", "),
                        t("documents", { count: kind.documentCount }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="flex gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === 0 || pending}
                      aria-label={t("moveUp", { name })}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === order.length - 1 || pending}
                      aria-label={t("moveDown", { name })}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("edit", { name })}
                      onClick={() => {
                        setFields(toFields(kind));
                        setEditing(kind.id);
                      }}
                    >
                      <Pencil />
                    </Button>
                    {kind.retired ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={pending}
                        aria-label={t("restore", { name })}
                        onClick={() => run(() => retireDocumentKindAction(kind.id, false), t("restored"))}
                      >
                        <ArchiveRestore />
                      </Button>
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={pending || active <= 1}
                        title={active <= 1 ? t("lastKind") : undefined}
                        aria-label={t("retire", { name })}
                        onClick={() => run(() => retireDocumentKindAction(kind.id, true), t("retiredDone"))}
                      >
                        <Archive />
                      </Button>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pending || order.length <= 1}
                      aria-label={t("merge", { name })}
                      onClick={() => merge(kind)}
                    >
                      <GitMerge />
                    </Button>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {editing === "new" ? (
        form
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setFields(toFields());
            setEditing("new");
          }}
        >
          <Plus /> {t("add")}
        </Button>
      )}
    </div>
  );
}
