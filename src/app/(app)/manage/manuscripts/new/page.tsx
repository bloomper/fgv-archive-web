import { getTranslations } from "next-intl/server";
import { getDocumentKinds, getSpexPage } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { NewManuscript } from "./new-manuscript.client";

/**
 * A new document: of the address' kind (`?kind=`, else the first), for the address' spex (`?spex=`) or FGV's own.
 */
export default async function NewManuscriptPage({ searchParams }: { searchParams: Promise<{ spex?: string; kind?: string }> }) {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("NewManuscript");
    const { spex: spexId, kind } = await searchParams;
    const [spex, kinds] = await Promise.all([
      spexId && ID.test(spexId) ? getSpexPage(spexId) : null,
      getDocumentKinds(false),
    ]);
    const original = spex?.original ?? spex;
    const kindId = kinds.find(candidate => candidate.id === kind)?.id ?? kinds[0]?.id ?? "";

    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("text")}</p>
        {/* Keyed by the spex and kind: Next keeps this page alive, and the form starts from the address */}
        <NewManuscript key={`${original?.id ?? ""}:${kindId}`} kindId={kindId}
                       kinds={kinds.map(({ id, name }) => ({ id, name }))} spex={original ? {
          id: original.id, title: original.title, year: original.year, revival: original.revival,
          categoryName: original.categoryName,
        } : null} />
      </div>
    );
  });
}
