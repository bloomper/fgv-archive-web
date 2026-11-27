import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Download, ExternalLink, FilePlus, ScrollText } from "lucide-react";
import { Badge } from "@bloomper/fgv-web-ui/ui/badge";
import { buttonVariants } from "@bloomper/fgv-web-ui/ui/button";
import { VersionBadges } from "@/components/archive/version-meta";
import { CreateArrangementButton } from "@/components/archive/create-buttons.client";
import { getMe, getSpexPage } from "@/lib/archive/archive.server";
import { ShareLinkButton } from "@/components/archive/share-link-dialog.client";
import { isEditor } from "@/utils/auth";
import { ID } from "@/utils/filters";
import { arrangementHref, manuscriptHref, newDocumentHref, spexHref, spexName, spexPartsHref, versionAnchor } from "@/utils/links";
import { formatKey } from "@/utils/music";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { Page } from "@bloomper/fgv-web-ui/shell/page-header";

/**
 * A spex with its revivals, its documents by kind and their versions, and its numbers in the order of the show with their
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
    // Numbers and characters are kept in Spexipedia
    const acts = new Set(spex.numbers.map(number => number.act)).size;
    const spexipediaUrl = process.env.SPEXIPEDIA_WEB_URL?.trim().replace(/\/+$/, "") || null;
    const original = spex.original ?? spex;
    // A share link for the spex: the recommended (else newest) published version of each manuscript and arrangement
    const pick = <T extends { id: string; recommended: boolean; published: boolean; trashed: boolean }>(versions: T[]) =>
      versions.filter(version => version.published && !version.trashed)
        .sort((a, b) => Number(b.recommended) - Number(a.recommended))[0]?.id;
    const shareable = [
      ...spex.manuscripts.map(manuscript => pick(manuscript.versions)),
      ...spex.numbers.map(number => number.arrangement && pick(number.arrangement.versions)),
    ].filter((id): id is string => Boolean(id));
    // Documents by kind, in the kinds' order
    const kinds = [...new Map(spex.manuscripts.map(manuscript => [manuscript.kind.id, manuscript.kind])).values()]
      .sort((a, b) => a.position - b.position)
      .map(kind => ({ kind, documents: spex.manuscripts.filter(manuscript => manuscript.kind.id === kind.id) }));
    const maxMonths = editor ? (await getMe())?.settings.maxShareLinkMonths ?? 24 : 24;

    return (
      <Page variant="content">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {[spex.categoryName, spex.revival ? t("revival") : null].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {spex.title} <span className="tabular-nums text-muted-foreground">{spex.year}</span>
          </h1>
          {spex.original && (
            <p className="text-sm">
              {t("revivalOf")} <Link href={spexHref(spex.original.id)} className="text-link hover:text-link/80">{spexName(spex.original)}</Link>
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
              <Link href={newDocumentHref({ spexId: original.id })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}>
                <FilePlus /> {t("newManuscript")}
              </Link>
            )}
            {editor && shareable.length > 0 && (
              <ShareLinkButton input={{ versionIds: shareable }} defaultName={spexName(spex)} maxMonths={maxMonths}
                               label={t("share", { count: shareable.length })} />
            )}
          </div>
        </header>

        {kinds.length === 0 ? (
          <section aria-labelledby="documents" className="space-y-3">
            <h2 id="documents" className="text-lg font-semibold">{t("manuscripts")}</h2>
            <p className="text-sm text-muted-foreground">{t("noManuscripts")}</p>
          </section>
        ) : kinds.map(({ kind, documents }) => (
          <section key={kind.id} aria-labelledby={`kind-${kind.id}`} className="space-y-3">
            <h2 id={`kind-${kind.id}`} className="text-lg font-semibold">{kind.name}</h2>
            <ul className="space-y-3">
              {documents.map(manuscript => (
                <li key={manuscript.id} className="link-row rounded-lg border bg-card p-3">
                  <Link href={manuscriptHref(manuscript.id)} className="row-link flex items-center gap-2 font-medium">
                    <ScrollText className="size-4 text-link" aria-hidden /> {manuscript.title}
                  </Link>
                  {manuscript.authors && <p className="text-sm text-muted-foreground">{manuscript.authors}</p>}
                  <ul className="mt-2 space-y-1 text-sm">
                    {manuscript.versions.map(version => (
                      <li key={version.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`${manuscriptHref(manuscript.id)}#${versionAnchor(version.id)}`} className="hover:text-link">
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
          </section>
        ))}

        {spex.characters.length > 0 && (
          <section aria-labelledby="characters" className="space-y-2">
            <h2 id="characters" className="text-lg font-semibold">{t("characters")}</h2>
            <p className="text-sm">{spex.characters.map(character => character.name).join(", ")}</p>
          </section>
        )}

        <section aria-labelledby="numbers" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="numbers" className="text-lg font-semibold">{t("numbers")}</h2>
            {editor && spexipediaUrl && (
              <a href={`${spexipediaUrl}/manage/spex/${spex.id}`} target="_blank" rel="noopener noreferrer"
                 className={buttonVariants({ variant: "outline", size: "sm" })}>
                <ExternalLink /> {t("editInSpexipedia")}
              </a>
            )}
          </div>
          {spex.numbersInherited && spex.numbers.length > 0 && (
            <p className="text-sm text-muted-foreground">{t("inherited")}</p>
          )}
          {spex.numbers.length === 0 ? <p className="text-sm text-muted-foreground">{t("noNumbers")}</p> : (
            <ol className="divide-y overflow-hidden rounded-lg border bg-card" aria-label={t("numbers")}>
              {spex.numbers.map(number => {
                const arrangement = number.arrangement;
                const keys = [...new Set((arrangement?.versions ?? []).filter(v => v.key).map(v => formatKey(v.key!, locale)))];

                return (
                  <li key={number.id} data-testid="number-row"
                      className="link-row flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                      {acts > 1 ? `${number.act}:${number.position}` : `${number.position}.`}
                    </span>
                    <div className="min-w-0 flex-1 basis-48">
                      {arrangement
                        ? <Link href={arrangementHref(arrangement.id)} className="row-link font-medium">{number.title}</Link>
                        : <span className="font-medium">{number.title}</span>}
                      <p className="text-xs text-muted-foreground">
                        {number.originalSong}
                      </p>
                      {number.retired && <Badge variant="outline">{t("retiredNumber")}</Badge>}
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
      </Page>
    );
  });
}
