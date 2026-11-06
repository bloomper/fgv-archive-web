import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/admin/admin.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { SettingsForm } from "./settings-form.client";

export default async function SettingsPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminSettings");
    const settings = await getSettings();

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        {settings && <SettingsForm key={JSON.stringify(settings)} initial={settings} />}
      </div>
    );
  });
}
