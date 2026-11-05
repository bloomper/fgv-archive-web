"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, CalendarPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/components/dialogs.client";
import { extendShareLinkAction, renameShareLinkAction, revokeShareLinkAction } from "@/app/(app)/manage/actions.server";

/**
 * Renames a share link, extends it to a number of months from now, or revokes it.
 */
export function ShareLinkActions({ id, name, revoked, maxMonths }: { id: string; name: string; revoked: boolean; maxMonths: number }) {
  const t = useTranslations("ShareLinks");
  const router = useRouter();
  const dialogs = useDialogs();
  const [pending, startTransition] = useTransition();

  if (revoked) {
    return null;
  }
  return (
    <span className="flex flex-wrap gap-1">
      <Button size="xs" variant="outline" disabled={pending} aria-label={t("renameOf", { name })} onClick={async () => {
        const next = await dialogs.prompt({
          title: t("renameTitle", { name }), label: t("name"), defaultValue: name, confirmLabel: t("rename"), maxLength: 200,
        });

        if (next && next !== name) {
          startTransition(async () => {
            const result = await renameShareLinkAction(id, next);

            if (result.ok) {
              toast.success(t("renamed"));
              router.refresh();
            } else {
              toast.error(result.message);
            }
          });
        }
      }}>
        <Pencil /> {t("rename")}
      </Button>
      <Button size="xs" variant="outline" disabled={pending} aria-label={t("extendOf", { name })} onClick={async () => {
        const months = await dialogs.prompt({
          title: t("extendTitle", { name }), label: t("extendLabel", { max: maxMonths }), defaultValue: "12",
          confirmLabel: t("extend"), maxLength: 3,
        });
        const value = Number(months);

        if (months && Number.isInteger(value) && value >= 1 && value <= maxMonths) {
          startTransition(async () => {
            const result = await extendShareLinkAction(id, value);

            if (result.ok) {
              toast.success(t("extended"));
              router.refresh();
            } else {
              toast.error(result.message);
            }
          });
        } else if (months) {
          toast.error(t("monthsInvalid", { max: maxMonths }));
        }
      }}>
        <CalendarPlus /> {t("extend")}
      </Button>
      <Button size="xs" variant="outline" disabled={pending} aria-label={t("revokeOf", { name })} onClick={async () => {
        if (await dialogs.confirm({ title: t("revokeTitle", { name }), description: t("revokeText"), confirmLabel: t("revoke"), destructive: true })) {
          startTransition(async () => {
            const result = await revokeShareLinkAction(id);

            if (result.ok) {
              toast.success(t("revoked"));
              router.refresh();
            } else {
              toast.error(result.message);
            }
          });
        }
      }}>
        <Ban /> {t("revoke")}
      </Button>
    </span>
  );
}
