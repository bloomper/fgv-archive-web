"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/components/dialogs.client";
import type { ActionResult } from "@/lib/graphql.server";
import {
  deleteParentAction,
  deleteVersionAction,
  emptyTrashAction,
  trashParentAction,
  trashVersionAction,
} from "@/app/(app)/manage/actions.server";

type Kind = "MANUSCRIPT" | "ARRANGEMENT" | "VERSION";

/**
 * Restores an item from the trash; admins also delete it for good, with its files.
 */
export function TrashActions({ kind, id, title, admin }: { kind: Kind; id: string; title: string; admin: boolean }) {
  const t = useTranslations("Trash");
  const router = useRouter();
  const dialogs = useDialogs();
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<ActionResult<unknown>>, done: string) => startTransition(async () => {
    const result = await work();

    if (result.ok) {
      toast.success(done);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  });

  return (
    <span className="flex gap-1">
      <Button size="xs" variant="outline" disabled={pending} aria-label={t("restoreOf", { title })}
              onClick={() => run(() => kind === "VERSION" ? trashVersionAction(id, false) : trashParentAction(kind, id, false), t("restored"))}>
        <Undo2 /> {t("restore")}
      </Button>
      {admin && (
        <Button size="xs" variant="destructive" disabled={pending} aria-label={t("deleteOf", { title })} onClick={async () => {
          if (await dialogs.confirm({ title: t("deleteTitle", { title }), description: t("deleteText"), confirmLabel: t("delete"), destructive: true })) {
            run(() => kind === "VERSION" ? deleteVersionAction(id) : deleteParentAction(kind, id), t("deleted"));
          }
        }}>
          <Trash2 /> {t("delete")}
        </Button>
      )}
    </span>
  );
}

export function EmptyTrashButton() {
  const t = useTranslations("Trash");
  const router = useRouter();
  const dialogs = useDialogs();
  const [pending, startTransition] = useTransition();

  return (
    <Button variant="destructive" disabled={pending} onClick={async () => {
      if (await dialogs.confirm({ title: t("emptyTitle"), description: t("emptyText"), confirmLabel: t("empty"), destructive: true })) {
        startTransition(async () => {
          const result = await emptyTrashAction();

          if (result.ok) {
            toast.success(t("emptied"));
            router.refresh();
          } else {
            toast.error(result.message);
          }
        });
      }
    }}>
      <Trash2 /> {t("empty")}
    </Button>
  );
}
