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
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("text")}</p>
        <NewManuscript spex={original ? {
          id: original.id, title: original.title, year: original.year, revival: original.revival,
          categoryName: original.categoryName,
        } : null} />
      </div>
    );
  });
}
