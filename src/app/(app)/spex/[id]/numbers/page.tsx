import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NumberEditor } from "@/components/archive/number-editor.client";
import { getSpexPage } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { spexHref, spexName } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * The editors' page for a spex' numbers. A revival without numbers of its own shows its original's, and its own
 * numbers start when the first is added here.
 */
export default async function NumbersPage({ params }: { params: Promise<{ id: string }> }) {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const { id } = await params;
    const spex = ID.test(id) ? await getSpexPage(id) : null;

    if (!spex) {
      notFound();
    }

    const t = await getTranslations("Numbers");
    const own = spex.numbersInherited ? [] : spex.numbers;

    return (
      <div className="max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="space-y-1">
          <Link href={spexHref(spex.id)} className="text-sm text-primary hover:text-primary/80">← {spexName(spex)}</Link>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title", { spex: spexName(spex) })}</h1>
          <p className="text-sm text-muted-foreground">{t("text")}</p>
          {spex.numbersInherited && <p className="text-sm text-muted-foreground">{t("inheritedHint")}</p>}
        </div>
        <NumberEditor spexId={spex.id} numbers={own.map(number => ({
          id: number.id,
          position: number.position,
          title: number.title,
          originalSong: number.originalSong,
          lyricist: number.lyricist,
          composer: number.composer,
          hasArrangement: Boolean(number.arrangement),
        }))} />
      </div>
    );
  });
}
