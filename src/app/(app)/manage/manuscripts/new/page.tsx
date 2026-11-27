import { getTranslations } from "next-intl/server";
import { getDocumentKinds, getSpexPage } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { NewManuscript } from "./new-manuscript.client";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

/**
 * A new document: of the address' kind (`?kind=`, else the first), for the address' spex (`?spex=`) or FGV's own.
 */
export default async function NewManuscriptPage({
  searchParams,
}: {
  searchParams: Promise<{ spex?: string; kind?: string }>;
}) {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("NewManuscript");
    const { spex: spexId, kind } = await searchParams;
    const [spex, kinds] = await Promise.all([
      spexId && ID.test(spexId) ? getSpexPage(spexId) : null,
      getDocumentKinds(false),
    ]);
    const original = spex?.original ?? spex;
    const kindId = kinds.find((candidate) => candidate.id === kind)?.id ?? kinds[0]?.id ?? "";

    return (
      <Page variant="content">
        <PageHeader
          title={t("heading")}
          description={t("text")}
        />
        {/* Keyed by the spex and kind: Next keeps this page alive, and the form starts from the address */}
        <NewManuscript
          key={`${original?.id ?? ""}:${kindId}`}
          kindId={kindId}
          kinds={kinds.map(({ id, name }) => ({ id, name }))}
          spex={
            original
              ? {
                  id: original.id,
                  title: original.title,
                  year: original.year,
                  revival: original.revival,
                  categoryName: original.categoryName,
                }
              : null
          }
        />
      </Page>
    );
  });
}
