import { getTranslations } from "next-intl/server";
import { getDocumentKinds } from "@/lib/archive/archive.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { DocumentKindsEditor } from "@/components/admin/document-kinds-editor.client";

export default async function DocumentKindsPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminDocumentKinds");
    const kinds = await getDocumentKinds(true);

    return (
      <div className="max-w-3xl flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <DocumentKindsEditor kinds={kinds} />
      </div>
    );
  });
}
