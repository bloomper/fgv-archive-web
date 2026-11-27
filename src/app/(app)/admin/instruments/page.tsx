import { getTranslations } from "next-intl/server";
import { getInstruments } from "@/lib/archive/archive.server";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { InstrumentsEditor } from "./instruments-editor.client";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

export default async function InstrumentsPage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminInstruments");
    const instruments = await getInstruments();

    return (
      <Page variant="content" className="max-w-4xl">
        <PageHeader title={t("title")} description={t("text")}/>
        <InstrumentsEditor instruments={instruments.map(instrument => ({ ...instrument, useCount: instrument.useCount ?? 0 }))} />
      </Page>
    );
  });
}
