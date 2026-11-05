import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Download, FilePlus, ListOrdered, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { VersionBadges } from "@/components/archive/version-meta";
import { CreateArrangementButton } from "@/components/archive/create-buttons.client";
import { getSpexPage } from "@/lib/archive/archive.server";
import { isEditor } from "@/utils/auth";
import { ID } from "@/utils/filters";
import { arrangementHref, manuscriptHref, spexHref, spexName, spexPartsHref, versionAnchor } from "@/utils/links";
import { formatKey } from "@/utils/music";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * A spex with its revivals, its manuscripts and their versions, and its numbers in the order of the show with their
 * arrangements; numbers without one are marked.
 */
export default async function SpexPage({ params }: { params: Promise<{ id: string }> }) {
  return withPolicyPage(Policies.app.requireAccess, async (authz) => {
    const { id } = await params;
    const spex = ID.test(id) ? await getSpexPage(id) : null;

    if (!spex) {
      notFound();
    }

    const t = await getTranslations("SpexPage");
    const locale = await getLocale();
    const editor = isEditor(authz.roles);
    const original = spex.original ?? spex;

    return (
      <div className="space-y-8 p-4 sm:p-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {[spex.categoryName, spex.revival ? t("revival") : null].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {spex.title} <span className="tabular-nums text-muted-foreground">{spex.year}</span>
          </h1>
          {spex.original && (
            <p className="text-sm">
              {t("revivalOf")} <Link href={spexHref(spex.original.id)} className="text-primary hover:underline">{spexName(spex.original)}</Link>
            </p>
          )}
          {spex.revivals.length > 0 && (
            <nav aria-label={t("revivals")} className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">{t("revivals")}:</span>
              {spex.revivals.map(revival => (
                <Link key={revival.id} href={spexHref(revival.id)} className="rounded-md border px-2 py-0.5 hover:bg-accent">
                  {spexName(revival)}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {spex.arrangementCount > 0 && (
              <Link href={spexPartsHref(spex.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
        <Download /> {t("downloadParts")}
       </Link>
            )}
            {editor && (
              <Link href={`/manage/manuscripts/new?spex=${original.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        <FilePlus /> {t("newManuscript")}
       </Link>
            )}
          </div>
        </header>

        <section aria-labelledby="manuscripts" className="space-y-3">
          <h2 id="manuscripts" className="text-lg font-semibold">{t("manuscripts")}</h2>
          {spex.manuscripts.length === 0 ? <p className="text-sm text-muted-foreground">{t("noManuscripts")}</p> : (
            <ul className="space-y-3">
              {spex.manuscripts.map(manuscript => (
                <li key={manuscript.id} className="rounded-lg border bg-card p-3">
                  <Link href={manuscriptHref(manuscript.id)} className="flex items-center gap-2 font-medium hover:underline">
                    <ScrollText className="size-4 text-primary" aria-hidden /> {manuscript.title}
                  </Link>
                  {manuscript.authors && <p className="text-sm text-muted-foreground">{manuscript.authors}</p>}
                  <ul className="mt-2 space-y-1 text-sm">
                    {manuscript.versions.map(version => (
                      <li key={version.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`${manuscriptHref(manuscript.id)}#${versionAnchor(version.id)}`} className="hover:underline">
                          {version.label}
                        </Link>
                        {version.usedIn && <span className="text-muted-foreground">{spexName(version.usedIn)}</span>}
                        <VersionBadges version={version} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="numbers" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="numbers" className="text-lg font-semibold">{t("numbers")}</h2>
            {editor && (
              <Link href={`/spex/${spex.id}/numbers`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ListOrdered /> {t("editNumbers")}
       </Link>
            )}
          </div>
          {spex.numbersInherited && spex.numbers.length > 0 && (
            <p className="text-sm text-muted-foreground">{t("inherited")}</p>
          )}
          {spex.numbers.length === 0 ? <p className="text-sm text-muted-foreground">{t("noNumbers")}</p> : (
            <ol className="divide-y rounded-lg border bg-card" aria-label={t("numbers")}>
              {spex.numbers.map(number => {
                const arrangement = number.arrangement;
                const keys = [...new Set((arrangement?.versions ?? []).filter(v => v.key).map(v => formatKey(v.key!, locale)))];

                return (
                  <li key={number.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2" data-testid="number-row">
                    <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{number.position}.</span>
                    <div className="min-w-0 flex-1 basis-48">
                      {arrangement
                        ? <Link href={arrangementHref(arrangement.id)} className="font-medium hover:underline">{number.title}</Link>
                        : <span className="font-medium">{number.title}</span>}
                      <p className="text-xs text-muted-foreground">
                        {[number.originalSong, [number.lyricist, number.composer].filter(Boolean).join(" / ")].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {arrangement ? (
                      <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        {keys.join(", ")}
                        <Badge variant="outline">{t("versions", { count: arrangement.versions.length })}</Badge>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">{t("missing")}</Badge>
                        {editor && <CreateArrangementButton numberId={number.id} title={number.title} />}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    );
  });
}
