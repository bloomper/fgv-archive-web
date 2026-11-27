import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/admin/admin.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { SettingsForm } from "./settings-form.client";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

export default async function SettingsPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminSettings");
    const settings = await getSettings();

    return (
      <Page variant="content">
        <PageHeader title={t("title")}/>
        {settings && <SettingsForm key={JSON.stringify(settings)} initial={settings} />}
      </Page>
    );
  });
}
