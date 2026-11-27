import { getTranslations } from "next-intl/server";
import { ShareLinkList } from "@/components/archive/share-link-list";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

export default async function AllShareLinksPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("ShareLinks");

    return (
      <Page
        variant="content"
        className="max-w-4xl"
      >
        <PageHeader
          title={t("allTitle")}
          description={t("allText")}
        />
        <ShareLinkList all />
      </Page>
    );
  });
}
