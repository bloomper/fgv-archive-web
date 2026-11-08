import Form from "next/form";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Lock, Search as SearchIcon } from "lucide-react";
import { SubmitButton } from "@/components/submit-button.client";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartFilterControls } from "@/components/archive/part-filter.client";
import { getInstruments, search } from "@/lib/archive/archive.server";
import { isEmptyFilter, partFilterFromParams, toGraphqlFilter } from "@/utils/filters";
import { arrangementHref, fileHref, manuscriptHref, spexHref, spexName } from "@/utils/links";
import { formatKey, formatKeys, formatTransposition, localName, parseKey, parseKeyParam } from "@/utils/music";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

type Search = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * Search across titles, authors, arrangers, original songs and numbers, and the text of the files, whose hits show
 * the page they are on and open the reader there; narrowed by instruments and transpositions, and by key ("Bb", "Ess-dur",
 * "f#m" are all understood).
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  return withPolicyPage(Policies.app.requireAccess, async () => {
    const t = await getTranslations("Search");
    const locale = await getLocale();
    const params = await searchParams;
    const q = first(params.q).trim().slice(0, 200);
    const keyText = first(params.key).trim().slice(0, 30);
    const key = parseKeyParam(keyText) ?? (keyText ? parseKey(keyText, locale) : null);
    const filter = partFilterFromParams(params);
    // One character is too little to search on (the server ignores it), but a key may still be searched
    const words = q.length >= 2 ? q : "";
    const tooShort = q.length === 1;
    const ready = Boolean(words || key);
    const [result, instruments] = await Promise.all([
      ready ? search(words, toGraphqlFilter(filter), key) : Promise.resolve(null),
      getInstruments(),
    ]);
    const found = result?.search;
    const total = found
      ? found.spex.length + found.manuscripts.length + found.numbers.length + found.arrangements.length + found.versions.length + found.textHits.length
      : 0;
    const heading = "text-lg font-semibold";
    const list = "divide-y overflow-hidden rounded-lg border bg-card";
    const row = "link-row px-3 py-2";

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Form action="/search" role="search" className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          {filter.instrumentIds.length > 0 && <input type="hidden" name="instruments" value={filter.instrumentIds.join(",")} />}
          {filter.transpositions.length > 0 && <input type="hidden" name="pitches" value={filter.transpositions.join(",")} />}
          <div className="space-y-1.5">
            <Label htmlFor="search-q">{t("query")}</Label>
            <Input id="search-q" name="q" type="search" defaultValue={q} maxLength={200} placeholder={t("placeholder")}
                   aria-invalid={tooShort || undefined} aria-describedby={tooShort ? "search-q-error" : undefined} />
            {tooShort && <p id="search-q-error" className="text-xs text-destructive">{t("tooShort")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-key">{t("key")}</Label>
            <Input id="search-key" name="key" defaultValue={key ? formatKey(key, locale) : keyText} maxLength={30}
                   placeholder={t("keyPlaceholder")} aria-describedby="search-key-hint" />
            <p id="search-key-hint" className="text-xs text-muted-foreground">
              {keyText && !key ? <span className="text-destructive">{t("keyUnknown")}</span> : t("keyHint")}
            </p>
          </div>
          <div className="flex items-start pt-6">
            <SubmitButton>{t("submit")}</SubmitButton>
          </div>
        </Form>
        <PartFilterControls instruments={instruments} />

        {!ready ? !tooShort && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{isEmptyFilter(filter) ? t("hint") : t("filterOnly")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/spex" className="text-sm text-primary hover:text-primary/80">{t("browse")}</Link>
            </EmptyContent>
          </Empty>
        ) : !found || total === 0 ? (
          <p className="text-muted-foreground">{t("none")}</p>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground" aria-live="polite">{t("count", { count: total })}</p>

            {found.spex.length > 0 && (
              <section className="space-y-2">
                <h2 className={heading}>{t("spex")}</h2>
                <ul className={list}>
                  {found.spex.map(spex => (
                    <li key={spex.id} className={row}>
                      <Link href={spexHref(spex.id)} className="row-link font-medium">{spexName(spex)}</Link>
                      <span className="text-sm text-muted-foreground"> · {spex.categoryName}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {found.manuscripts.length > 0 && (
              <section className="space-y-2">
                <h2 className={heading}>{t("manuscripts")}</h2>
                <ul className={list}>
                  {found.manuscripts.map(manuscript => (
                    <li key={manuscript.id} className={row}>
                      <Link href={manuscriptHref(manuscript.id)} className="row-link font-medium">{manuscript.title}</Link>
                      <span className="text-sm text-muted-foreground"> · {[spexName(manuscript.spex), manuscript.authors].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {found.numbers.length > 0 && (
              <section className="space-y-2">
                <h2 className={heading}>{t("numbers")}</h2>
                <ul className={list}>
                  {found.numbers.map(number => (
                    <li key={number.id} className={row}>
                      {number.arrangement
                        ? <Link href={arrangementHref(number.arrangement.id)} className="row-link font-medium">{number.title}</Link>
                        : <Link href={spexHref(number.spex.id)} className="row-link font-medium">{number.title}</Link>}
                      <span className="text-sm text-muted-foreground"> · {[spexName(number.spex), number.originalSong].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {found.arrangements.length > 0 && (
              <section className="space-y-2">
                <h2 className={heading}>{t("arrangements")}</h2>
                <ul className={list}>
                  {found.arrangements.map(arrangement => (
                    <li key={arrangement.id} className={row}>
                      <Link href={arrangementHref(arrangement.id)} className="row-link font-medium">{arrangement.number.title}</Link>
                      <span className="text-sm text-muted-foreground"> · {spexName(arrangement.number.spex)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {found.versions.length > 0 && (
              <section className="space-y-2">
                <h2 className={heading}>{t("versionsInKey", { key: key ? formatKey(key, locale) : "" })}</h2>
                <ul className={list}>
                  {found.versions.map(version => version.arrangement && (
                    <li key={version.id} className={row}>
                      <Link href={`${arrangementHref(version.arrangement.id)}#version-${version.id}`} className="row-link font-medium">
                        {version.arrangement.number.title}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {" · "}{[version.label, formatKeys(version.key, version.modulations, locale), spexName(version.arrangement.number.spex)].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {found.textHits.length > 0 && (
              <section className="space-y-2">
                <h2 className={heading}>{t("textHits")}</h2>
                {!isEmptyFilter(filter) && <p className="text-xs text-muted-foreground">{t("textHitsFiltered")}</p>}
                <ul className={list}>
                  {found.textHits.map((hit, index) => {
                    const parent = hit.version.manuscript?.title ?? hit.version.arrangement?.number.title;
                    const spex = hit.version.manuscript?.spex ?? hit.version.arrangement?.number.spex;
                    const transposition = formatTransposition(hit.file.transposition, locale);

                    return (
                      <li key={`${hit.file.id}-${hit.page}-${index}`} className={`${row} space-y-1`} data-testid="text-hit">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          {hit.file.canOpen
                            ? <Link href={fileHref(hit.file.id, {}, hit.page)} className="row-link font-medium">{hit.file.title}</Link>
                            : <span className="inline-flex items-center gap-1 font-medium"><Lock className="size-3.5" aria-hidden />{hit.file.title}</span>}
                          {hit.page && <span className="text-sm text-primary">{t("page", { page: hit.page })}</span>}
                          <span className="text-sm text-muted-foreground">
                            {[parent, hit.version.label, spexName(spex), localName(hit.file.role, locale),
                              hit.file.instruments.map(instrument => localName(instrument, locale)).join(" / "), transposition]
                              .filter(Boolean).join(" · ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">…{hit.snippet}…</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    );
  });
}
