import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAccessRequests } from "@/lib/admin/admin.server";
import { formatInstant } from "@/utils/format";
import { fileHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * Users' requests for access to restricted files, newest first; the editors also get them by email. Access is given
 * with a share link.
 */
export default async function AccessRequestsPage() {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("AccessRequests");
    const requests = await getAccessRequests();

    return (
      <div className="max-w-4xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        {requests.length === 0 ? <p className="text-muted-foreground">{t("none")}</p> : (
          <ul className="space-y-3">
            {requests.map(request => (
              <li key={request.id} className="space-y-2 rounded-lg border bg-card p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {request.userName ?? "–"}
                    {request.userEmail && (
                      <a href={`mailto:${request.userEmail}`} className="ml-2 text-sm font-normal text-primary hover:underline">{request.userEmail}</a>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatInstant(request.createdAt)}</span>
                </div>
                <p className="whitespace-pre-line text-sm">{request.reason}</p>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {request.files.map(file => (
                    <li key={file.id}>
                      <Link href={fileHref(file.id)} className="text-primary hover:underline">{file.title}</Link>
                      {" "}<Link href={`/versions/${file.versionId}/edit`} className="text-xs text-muted-foreground hover:underline">({t("version")})</Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}
