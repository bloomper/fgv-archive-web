"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleAccessRequestAction } from "@/app/(app)/manage/actions.server";

/**
 * Marks an access request handled, or open again.
 */
export function HandleButton({ id, handled, name }: { id: string; handled: boolean; name: string }) {
  const t = useTranslations("AccessRequests");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button size="xs" variant={handled ? "outline" : "default"} disabled={pending}
            aria-label={handled ? t("reopenOf", { name }) : t("handleOf", { name })}
            onClick={() => startTransition(async () => {
              const result = await handleAccessRequestAction(id, !handled);

              if (result.ok) {
                toast.success(handled ? t("reopened") : t("handledDone"));
                router.refresh();
              } else {
                toast.error(result.message);
              }
            })}>
      {handled ? <><Undo2 /> {t("reopen")}</> : <><Check /> {t("handle")}</>}
    </Button>
  );
}
