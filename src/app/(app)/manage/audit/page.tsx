import { getTranslations } from "next-intl/server";
import { ChangeLog } from "@/components/audit/change-log";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { isAdmin } from "@/utils/auth";
import { type AuditSearch, auditSearchOf } from "@/utils/audit";
import { loadAuditPage } from "./actions.server";
import { auditLink, ENTITY_TYPES } from "./links";

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditSearch> }) {
  return withPolicyPage(Policies.editor.requireEditor, async authz => {
    const t = await getTranslations("Audit");
    const search = auditSearchOf(await searchParams);
    const admin = isAdmin(authz.roles);

    return (
      <Page>
        <PageHeader
          title={t("title")}
          description={admin ? t("textAdmin") : t("text")}
        />
        <ChangeLog
          path="/manage/audit"
          search={search}
          isAdmin={admin}
          entityTypes={ENTITY_TYPES}
          linkOf={auditLink}
          loadMore={loadAuditPage}
        />
      </Page>
    );
  });
}
