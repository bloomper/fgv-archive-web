import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { getMaintenanceJobs } from "@/lib/admin/admin.server";
import { formatInstant } from "@/utils/format";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { RefreshWhileRunning } from "./refresh-while-running.client";
import { RunJobButton } from "./run-job-button.client";

/**
 * The scheduled maintenance jobs, with their schedules and latest runs, and a button to run each now.
 */
export default async function MaintenancePage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminMaintenance");
    const jobs = await getMaintenanceJobs();

    return (
      <div className="max-w-2xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <RefreshWhileRunning running={jobs.some(job => job.running)} />
        <ul className="space-y-4">
          {jobs.map(job => (
            <li key={job.job} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium">{t(`jobs.${job.job}.title`)}</h2>
                {job.running && <Badge variant="secondary">{t("running")}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{t(`jobs.${job.job}.description`)}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                <dt className="text-muted-foreground">{t("schedule")}</dt>
                <dd>{job.schedule ? <code className="text-xs">{job.schedule}</code> : t("notScheduled")}</dd>
                <dt className="text-muted-foreground">{t("lastRun")}</dt>
                <dd className={job.lastSucceeded === false ? "text-destructive" : undefined}>
                  {!job.lastStartedAt
                    ? t("neverRun")
                    : job.lastSucceeded === false
                      ? t("failed", { at: formatInstant(job.lastStartedAt) ?? "" })
                      : job.lastSucceeded
                        ? t("succeeded", { at: formatInstant(job.lastFinishedAt ?? job.lastStartedAt) ?? "" })
                        : t("startedAt", { at: formatInstant(job.lastStartedAt) ?? "" })}
                </dd>
              </dl>
              <RunJobButton job={job.job} running={job.running} />
            </li>
          ))}
        </ul>
      </div>
    );
  });
}
