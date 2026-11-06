import { getTranslations } from "next-intl/server";
import { ShareLinkList } from "@/components/archive/share-link-list";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

export default async function ShareLinksPage() {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("ShareLinks");

    return (
      <div className="max-w-4xl space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <ShareLinkList all={false} />
      </div>
    );
  });
}
