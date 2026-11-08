import Form from "next/form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/submit-button.client";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CreateArrangementButton } from "@/components/archive/create-buttons.client";
import { getMissing } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { spexHref, spexName } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * The material still to hunt down: original spex without a published manuscript, and numbers without a published
 * arrangement, newest spex first, by category.
 */
export default async function MissingPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  return withPolicyPage(Policies.editor.requireEditor, async () => {
    const t = await getTranslations("Missing");
    const { category } = await searchParams;
    const categoryId = category && ID.test(category) ? category : null;
    const data = await getMissing(categoryId);

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-4xl text-sm text-muted-foreground">{t("text")}</p>
        <Form action="/manage/missing" className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="missing-category">{t("category")}</Label>
            <NativeSelect id="missing-category" name="category" defaultValue={categoryId ?? ""}>
              <NativeSelectOption value="">{t("allCategories")}</NativeSelectOption>
              {data?.categories.map(item => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <SubmitButton variant="outline">{t("filter")}</SubmitButton>
        </Form>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-2" aria-labelledby="missing-manuscripts">
            <h2 id="missing-manuscripts" className="text-lg font-semibold">
              {t("manuscripts", { count: data?.missingManuscripts.length ?? 0 })}
            </h2>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {data?.missingManuscripts.map(spex => (
                <li key={spex.id} className="link-row flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <Link href={spexHref(spex.id)} className="row-link">{spexName(spex)}</Link>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {spex.categoryName}
                    <Link href={`/manage/manuscripts/new?spex=${spex.id}`} className="text-primary hover:text-primary/80">{t("add")}</Link>
                  </span>
                </li>
              ))}
              {data?.missingManuscripts.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t("none")}</li>}
            </ul>
          </section>
          <section className="space-y-2" aria-labelledby="missing-arrangements">
            <h2 id="missing-arrangements" className="text-lg font-semibold">
              {t("arrangements", { count: data?.missingArrangements.length ?? 0 })}
            </h2>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {data?.missingArrangements.map(number => (
                <li key={number.id} className="link-row flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>
                    <span className="tabular-nums text-muted-foreground">{number.position}. </span>{number.title}
                    <Link href={spexHref(number.spex.id)} className="row-link ml-2 text-sm text-muted-foreground">
                      {spexName(number.spex)}
                    </Link>
                  </span>
                  <CreateArrangementButton numberId={number.id} title={number.title} />
                </li>
              ))}
              {data?.missingArrangements.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t("none")}</li>}
            </ul>
          </section>
        </div>
      </div>
    );
  });
}
