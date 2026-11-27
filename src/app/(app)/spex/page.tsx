import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DataEmpty } from "@bloomper/fgv-web-ui/shell/data-empty";
import { FilterBar, FilterReset, FilterSearch, FilterSelect, FilterToggle } from "@/components/url-filters.client";
import { getBrowse, getSpexList } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { spexHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

type Search = { category?: string; year?: string; q?: string; material?: string };

/**
 * The spex, newest first, each original with its revivals, narrowed by category, year, text, or to those with material.
 */
export default async function SpexListPage({ searchParams }: { searchParams: Promise<Search> }) {
  return withPolicyPage(Policies.app.requireAccess, async () => {
    const t = await getTranslations("SpexList");
    const search = await searchParams;
    const categoryId = search.category && ID.test(search.category) ? search.category : null;
    const year = /^\d{4}$/.test(search.year ?? "") ? Number(search.year) : null;
    const q = search.q?.trim().slice(0, 100) || null;
    const withMaterial = search.material === "1";
    const [browse, list] = await Promise.all([
      getBrowse(),
      getSpexList({ categoryId, year, q, withMaterial: withMaterial || null }),
    ]);

    return (
      <Page variant="content">
        <PageHeader title={t("title")} />
        <FilterBar
          label={t("filters")}
          values={{
            q: q ?? undefined,
            category: categoryId ?? undefined,
            year: year ? String(year) : undefined,
            material: withMaterial ? "1" : undefined,
          }}
        >
          <FilterSearch
            name="q"
            label={t("search")}
          />
          <FilterSelect
            name="category"
            label={t("category")}
            allLabel={t("allCategories")}
            options={browse?.categories.map((category) => ({ value: category.id, label: category.name })) ?? []}
          />
          <FilterSelect
            name="year"
            label={t("year")}
            allLabel={t("allYears")}
            options={browse?.years.map((value) => ({ value: String(value), label: String(value) })) ?? []}
          />
          <FilterToggle
            name="material"
            label={t("withMaterial")}
          />
          <FilterReset
            names={["q", "category", "year", "material"]}
            label={t("reset")}
          />
        </FilterBar>

        {list.length === 0 ? (
          <DataEmpty
            title={t("none")}
            description={t("noneText")}
          />
        ) : (
          <ul className="bg-card divide-y overflow-hidden rounded-lg border">
            {list.map((spex) => (
              <li key={spex.id}>
                <SpexLine
                  spex={spex}
                  t={t}
                />
                {spex.revivals.length > 0 && (
                  <ul className="mb-2 ml-6 border-l">
                    {spex.revivals.map((revival) => (
                      <li key={revival.id}>
                        <SpexLine
                          spex={revival}
                          t={t}
                          revival
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Page>
    );
  });
}

function SpexLine({
  spex,
  t,
  revival = false,
}: {
  spex: {
    id: string;
    title?: string | null;
    year?: number | null;
    categoryName?: string | null;
    manuscriptCount: number;
    arrangementCount: number;
  };
  t: Awaited<ReturnType<typeof getTranslations<"SpexList">>>;
  revival?: boolean;
}) {
  const empty = spex.manuscriptCount + spex.arrangementCount === 0;

  return (
    <div
      className={`link-row flex flex-wrap items-baseline justify-between gap-x-3 ${revival ? "px-3 py-1.5" : "px-3 py-2.5"}`}
    >
      <Link
        href={spexHref(spex.id)}
        className="row-link font-medium"
      >
        {spex.title} <span className="text-muted-foreground tabular-nums">{spex.year}</span>
        {revival && <span className="text-muted-foreground text-sm font-normal"> · {t("revival")}</span>}
      </Link>
      <span className={empty ? "text-muted-foreground text-xs italic" : "text-muted-foreground text-xs"}>
        {[
          !revival ? spex.categoryName : null,
          empty
            ? t("noMaterial")
            : t("counts", { manuscripts: spex.manuscriptCount, arrangements: spex.arrangementCount }),
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </div>
  );
}
