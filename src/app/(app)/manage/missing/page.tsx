import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FilterBar, FilterSelect } from "@/components/url-filters.client";
import { CreateArrangementButton } from "@/components/archive/create-buttons.client";
import { getMissing } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { spexHref, spexName } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

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
      <Page variant="content">
        <PageHeader
          title={t("title")}
          description={t("text")}
        />
        <FilterBar
          label={t("filters")}
          values={{ category: categoryId ?? undefined }}
        >
          <FilterSelect
            name="category"
            label={t("category")}
            allLabel={t("allCategories")}
            options={data?.categories.map((item) => ({ value: item.id, label: item.name })) ?? []}
          />
        </FilterBar>
        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="space-y-2"
            aria-labelledby="missing-manuscripts"
          >
            <h2
              id="missing-manuscripts"
              className="text-lg font-semibold"
            >
              {t("manuscripts", { count: data?.missingManuscripts.length ?? 0 })}
            </h2>
            <ul className="bg-card divide-y overflow-hidden rounded-lg border">
              {data?.missingManuscripts.map((spex) => (
                <li
                  key={spex.id}
                  className="link-row flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <Link
                    href={spexHref(spex.id)}
                    className="row-link"
                  >
                    {spexName(spex)}
                  </Link>
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    {spex.categoryName}
                    <Link
                      href={`/manage/manuscripts/new?spex=${spex.id}`}
                      className="text-link hover:text-link/80"
                    >
                      {t("add")}
                    </Link>
                  </span>
                </li>
              ))}
              {data?.missingManuscripts.length === 0 && (
                <li className="text-muted-foreground px-3 py-2 text-sm">{t("none")}</li>
              )}
            </ul>
          </section>
          <section
            className="space-y-2"
            aria-labelledby="missing-arrangements"
          >
            <h2
              id="missing-arrangements"
              className="text-lg font-semibold"
            >
              {t("arrangements", { count: data?.missingArrangements.length ?? 0 })}
            </h2>
            <ul className="bg-card divide-y overflow-hidden rounded-lg border">
              {data?.missingArrangements.map((number) => (
                <li
                  key={number.id}
                  className="link-row flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <span>
                    <span className="text-muted-foreground tabular-nums">{number.position}. </span>
                    {number.title}
                    <Link
                      href={spexHref(number.spex.id)}
                      className="row-link text-muted-foreground ml-2 text-sm"
                    >
                      {spexName(number.spex)}
                    </Link>
                  </span>
                  <CreateArrangementButton
                    numberId={number.id}
                    title={number.title}
                  />
                </li>
              ))}
              {data?.missingArrangements.length === 0 && (
                <li className="text-muted-foreground px-3 py-2 text-sm">{t("none")}</li>
              )}
            </ul>
          </section>
        </div>
      </Page>
    );
  });
}
