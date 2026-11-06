"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MaintenanceJob } from "@/gql/graphql";
import { runMaintenanceJobAction } from "../actions.server";

/**
 * Starts a maintenance job now, and refreshes the page to show it running.
 */
export function RunJobButton({ job, running }: { job: MaintenanceJob; running: boolean }) {
  const t = useTranslations("AdminMaintenance");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = () => startTransition(async () => {
    const result = await runMaintenanceJobAction(job);

    if (!result.ok) {
      toast.error(result.message);
    } else if (result.data) {
      toast.success(t("started", { job: t(`jobs.${job}.title`) }));
      router.refresh();
    } else {
      toast.info(t("alreadyRunning", { job: t(`jobs.${job}.title`) }));
    }
  });

  return (
    <Button size="sm" variant="outline" disabled={pending || running} onClick={run}>
      {pending || running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
      {t("runNow")}
    </Button>
  );
}
