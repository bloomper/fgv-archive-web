import { getTranslations } from "next-intl/server";
import { getDocumentKinds } from "@/lib/archive/archive.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { DocumentKindsEditor } from "@/components/admin/document-kinds-editor.client";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

export default async function DocumentKindsPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminDocumentKinds");
    const kinds = await getDocumentKinds(true);

    return (
      <Page
        variant="content"
        className="max-w-3xl"
      >
        <PageHeader
          title={t("title")}
          description={t("text")}
        />
        <DocumentKindsEditor kinds={kinds} />
      </Page>
    );
  });
}
