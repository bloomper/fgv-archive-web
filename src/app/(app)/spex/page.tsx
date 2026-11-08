import Form from "next/form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/submit-button.client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DataEmpty } from "@/components/data-empty";
import { getBrowse, getSpexList } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { spexHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

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
    const filtered = Boolean(categoryId || year || q || withMaterial);

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Form action="/spex" role="search" aria-label={t("filters")}
              className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="spex-q">{t("search")}</Label>
            <Input id="spex-q" name="q" type="search" defaultValue={q ?? ""} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spex-category">{t("category")}</Label>
            <NativeSelect id="spex-category" name="category" defaultValue={categoryId ?? ""} className="w-full">
              <NativeSelectOption value="">{t("allCategories")}</NativeSelectOption>
              {browse?.categories.map(category => (
                <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spex-year">{t("year")}</Label>
            <NativeSelect id="spex-year" name="year" defaultValue={year ? String(year) : ""} className="w-full">
              <NativeSelectOption value="">{t("allYears")}</NativeSelectOption>
              {browse?.years.map(value => <NativeSelectOption key={value} value={String(value)}>{value}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="material" value="1" defaultChecked={withMaterial} className="size-4 accent-primary" />
            {t("withMaterial")}
          </label>
          <div className="flex items-end gap-2">
            <SubmitButton>{t("filter")}</SubmitButton>
            {filtered && <Link href="/spex" className="px-2 py-2 text-sm text-primary hover:text-primary/80">{t("reset")}</Link>}
          </div>
        </Form>

        {list.length === 0 ? <DataEmpty title={t("none")} description={t("noneText")} /> : (
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {list.map(spex => (
              <li key={spex.id}>
                <SpexLine spex={spex} t={t} />
                {spex.revivals.length > 0 && (
                  <ul className="mb-2 ml-6 border-l">
                    {spex.revivals.map(revival => (
                      <li key={revival.id}><SpexLine spex={revival} t={t} revival /></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  });
}

function SpexLine({ spex, t, revival = false }: {
  spex: { id: string; title?: string | null; year?: number | null; categoryName?: string | null; manuscriptCount: number; arrangementCount: number };
  t: Awaited<ReturnType<typeof getTranslations<"SpexList">>>;
  revival?: boolean;
}) {
  const empty = spex.manuscriptCount + spex.arrangementCount === 0;

  return (
    <div className={`link-row flex flex-wrap items-baseline justify-between gap-x-3 ${revival ? "px-3 py-1.5" : "px-3 py-2.5"}`}>
      <Link href={spexHref(spex.id)} className="row-link font-medium">
        {spex.title} <span className="tabular-nums text-muted-foreground">{spex.year}</span>
        {revival && <span className="text-sm font-normal text-muted-foreground"> · {t("revival")}</span>}
      </Link>
      <span className={empty ? "text-xs text-muted-foreground italic" : "text-xs text-muted-foreground"}>
        {[!revival ? spex.categoryName : null,
          empty ? t("noMaterial") : t("counts", { manuscripts: spex.manuscriptCount, arrangements: spex.arrangementCount })]
          .filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}
