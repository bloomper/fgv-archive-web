import { getTranslations } from "next-intl/server";
import { ChangeLog } from "@/components/audit/change-log";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { isAdmin } from "@/utils/auth";
import type { AuditSearch } from "@/utils/audit";
import { auditLink, ENTITY_TYPES } from "./links";

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditSearch> }) {
  return withPolicyPage(Policies.editor.requireEditor, async (authz) => {
    const t = await getTranslations("Audit");
    const search = await searchParams;

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{isAdmin(authz.roles) ? t("textAdmin") : t("text")}</p>
        <ChangeLog path="/manage/audit" search={search} isAdmin={isAdmin(authz.roles)} entityTypes={ENTITY_TYPES}
                   linkOf={auditLink} />
      </div>
    );
  });
}
