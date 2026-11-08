import { getTranslations } from "next-intl/server";
import { getInstruments } from "@/lib/archive/archive.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { InstrumentsEditor } from "./instruments-editor.client";

export default async function InstrumentsPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminInstruments");
    const instruments = await getInstruments();

    return (
      <div className="max-w-4xl flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
        <InstrumentsEditor instruments={instruments.map(instrument => ({ ...instrument, useCount: instrument.useCount ?? 0 }))} />
      </div>
    );
  });
}
