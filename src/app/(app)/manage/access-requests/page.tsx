import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LinkTabs } from "@/components/link-tabs";
import { getAccessRequests } from "@/lib/admin/admin.server";
import { formatDate, formatInstant } from "@/utils/format";
import { fileHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { HandleButton } from "./handle-button.client";

type Show = "open" | "handled" | "all";

/**
 * Users' requests for access to restricted files, newest first; the editors also get them by email. Access is given
 * with a share link, and the request is then marked handled. Open requests are shown first (`?show=handled|all`).
 */
export default async function AccessRequestsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("AccessRequests");
    const { show: raw } = await searchParams;
    const show: Show = raw === "handled" || raw === "all" ? raw : "open";
    const requests = await getAccessRequests(show === "all" ? null : show === "handled");
    const tab = (value: Show) => ({
      href: value === "open" ? "/manage/access-requests" : `/manage/access-requests?show=${value}`,
      label: t(value),
      active: show === value,
    });

    return (
      <div className="max-w-4xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <LinkTabs label={t("filter")} items={[tab("open"), tab("handled"), tab("all")]} />
        {requests.length === 0 ? (
          <p className="text-muted-foreground">{show === "open" ? t("noneOpen") : show === "handled" ? t("noneHandled") : t("none")}</p>
        ) : (
          <ul className="space-y-3">
            {requests.map(request => (
              <li key={request.id} className="space-y-2 rounded-lg border bg-card p-3" data-testid="access-request">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {request.userName ?? "–"}
                    {request.userEmail && (
                      <a href={`mailto:${request.userEmail}`} className="ml-2 text-sm font-normal text-primary hover:text-primary/80">{request.userEmail}</a>
                    )}
                  </p>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">{formatInstant(request.createdAt)}</span>
                    <HandleButton id={request.id} handled={Boolean(request.handledAt)} name={request.userName ?? ""} />
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm">{request.reason}</p>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {request.files.map(file => (
                    <li key={file.id}>
                      <Link href={fileHref(file.id)} className="text-primary hover:text-primary/80">{file.title}</Link>
                      {" "}<Link href={`/versions/${file.versionId}/edit`} className="text-xs text-muted-foreground hover:text-primary">({t("version")})</Link>
                    </li>
                  ))}
                </ul>
                {request.handledAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("handledBy", { date: formatDate(request.handledAt) ?? "", name: request.handledByName ?? "–" })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
