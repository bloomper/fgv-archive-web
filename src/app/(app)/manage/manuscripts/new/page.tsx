import { getTranslations } from "next-intl/server";
import { getSpexPage } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { NewManuscript } from "./new-manuscript.client";

export default async function NewManuscriptPage({ searchParams }: { searchParams: Promise<{ spex?: string }> }) {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("NewManuscript");
    const { spex: spexId } = await searchParams;
    const spex = spexId && ID.test(spexId) ? await getSpexPage(spexId) : null;
    const original = spex?.original ?? spex;

    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("text")}</p>
        {/* Keyed by the spex: Next keeps this page alive, and the picker starts from the address' spex */}
        <NewManuscript key={original?.id ?? ""} spex={original ? {
          id: original.id, title: original.title, year: original.year, revival: original.revival,
          categoryName: original.categoryName,
        } : null} />
      </div>
    );
  });
}
