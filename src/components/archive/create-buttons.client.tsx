"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createArrangementAction } from "@/app/(app)/manage/actions.server";
import { versionEditHref } from "@/utils/links";
import { track } from "@/utils/umami";

/**
 * Creates the arrangement of a number, with its first version, and opens that version for uploading.
 */
export function CreateArrangementButton({ numberId, title }: { numberId: string; title: string }) {
  const t = useTranslations("SpexPage");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button size="xs" variant="outline" disabled={pending} aria-label={t("createArrangementOf", { title })}
            onClick={() => startTransition(async () => {
              const result = await createArrangementAction(numberId);

              if (!result.ok) {
                toast.error(result.message);
              } else {
                track("arrangement-create");
                router.push(result.data.versionId ? versionEditHref(result.data.versionId) : `/arrangements/${result.data.id}`);
              }
            })}>
      <Plus /> {t("createArrangement")}
    </Button>
  );
}
