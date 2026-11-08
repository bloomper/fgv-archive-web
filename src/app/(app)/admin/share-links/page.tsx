import { getTranslations } from "next-intl/server";
import { ShareLinkList } from "@/components/archive/share-link-list";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

export default async function AllShareLinksPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("ShareLinks");

    return (
      <div className="max-w-4xl flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("allTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("allText")}</p>
        <ShareLinkList all />
      </div>
    );
  });
}
