"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Star, StarOff, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/components/dialogs.client";
import type { ActionResult } from "@/lib/graphql.server";
import {
  copyVersionAction,
  deleteVersionAction,
  publishVersionAction,
  recommendVersionAction,
  trashVersionAction,
} from "@/app/(app)/manage/actions.server";
import { versionEditHref } from "@/utils/links";
import { track } from "@/utils/umami";

/**
 * Publishing, recommending, copying and the trash for a version; admins delete a trashed version for good.
 */
export function VersionState({ id, published, recommended, trashed, admin, parentHref }: {
  id: string;
  published: boolean;
  recommended: boolean;
  trashed: boolean;
  admin: boolean;
  parentHref: string;
}) {
  const t = useTranslations("VersionState");
  const router = useRouter();
  const dialogs = useDialogs();
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<ActionResult<unknown>>, done: string, after?: () => void) => startTransition(async () => {
    const result = await work();

    if (result.ok) {
      toast.success(done);
      if (after) {
        after();
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.message);
    }
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={published ? "outline" : "default"} disabled={pending || trashed}
              onClick={() => {
                track("version-publish", { published: !published });
                run(() => publishVersionAction(id, !published), published ? t("unpublished") : t("published"));
              }}>
        {published ? <><EyeOff /> {t("unpublish")}</> : <><Eye /> {t("publish")}</>}
      </Button>
      <Button size="sm" variant="outline" disabled={pending || trashed}
              onClick={() => run(() => recommendVersionAction(id, !recommended), recommended ? t("notRecommended") : t("recommendedDone"))}>
        {recommended ? <><StarOff /> {t("unrecommend")}</> : <><Star /> {t("recommend")}</>}
      </Button>
      <Button size="sm" variant="outline" disabled={pending}
              onClick={() => startTransition(async () => {
                const result = await copyVersionAction(id);

                if (result.ok && result.data) {
                  toast.success(t("copied"));
                  router.push(versionEditHref(result.data));
                } else if (!result.ok) {
                  toast.error(result.message);
                }
              })}>
        <Copy /> {t("copy")}
      </Button>
      {trashed ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => trashVersionAction(id, false), t("restored"))}>
          <Undo2 /> {t("restore")}
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={async () => {
          if (await dialogs.confirm({ title: t("trashTitle"), description: t("trashText"), confirmLabel: t("toTrash"), destructive: true })) {
            run(() => trashVersionAction(id, true), t("trashed"), () => router.push(parentHref));
          }
        }}>
          <Trash2 /> {t("toTrash")}
        </Button>
      )}
      {admin && trashed && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={async () => {
          if (await dialogs.confirm({ title: t("deleteTitle"), description: t("deleteText"), confirmLabel: t("delete"), destructive: true })) {
            run(() => deleteVersionAction(id), t("deleted"), () => router.push(parentHref));
          }
        }}>
          <X /> {t("delete")}
        </Button>
      )}
    </div>
  );
}
