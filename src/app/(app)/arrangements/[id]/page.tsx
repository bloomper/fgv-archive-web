import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Download, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileList, PartsByInstrument } from "@/components/archive/file-list";
import { instrumentationText, VersionBadges, VersionFacts } from "@/components/archive/version-meta";
import { AccessRequest } from "@/components/archive/access-request.client";
import { ParentActions } from "@/components/archive/parent-actions.client";
import { PartFilterControls } from "@/components/archive/part-filter.client";
import { getArrangement } from "@/lib/archive/archive.server";
import { isEditor } from "@/utils/auth";
import { ID, isEmptyFilter, partFilterFromParams, partFilterToApiQuery, toGraphqlFilter } from "@/utils/filters";
import {
  spexHref,
  spexName,
  versionAnchor,
  versionEditHref,
  versionPartsZipHref,
  versionZipHref,
} from "@/utils/links";
import { formatKeys, type Pitch, PITCHES } from "@/utils/music";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

type Search = Record<string, string | string[] | undefined>;

/**
 * An arrangement: the number, its versions side by side (key and modulations, instrumentation) so a singer can pick
 * one, and each version's files with its parts listed by instrument, narrowed by instruments and transpositions, with
 * downloads of a file, the version, all its parts or the chosen ones.
 */
export default async function ArrangementPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  return withPolicyPage(Policies.app.requireAccess, async (authz) => {
    const { id } = await params;

    if (!ID.test(id)) {
      notFound();
    }

    const filter = partFilterFromParams(await searchParams);
    const data = await getArrangement(id, toGraphqlFilter(filter));
    const arrangement = data?.arrangement;

    if (!arrangement) {
      notFound();
    }

    const t = await getTranslations("ArrangementPage");
    const locale = await getLocale();
    const editor = isEditor(authz.roles);
    const number = arrangement.number;
    const filtered = !isEmptyFilter(filter);
    const allParts = arrangement.versions.flatMap(version => version.allFiles).filter(file => file.instruments.length > 0);
    const presentInstruments = new Set(allParts.flatMap(file => file.instruments.map(instrument => instrument.id)));
    const presentPitches = new Set(allParts.map(file => file.transposition?.pitch).filter(Boolean) as Pitch[]);
    const query = partFilterToApiQuery(filter);

    return (
      <div className="space-y-8 p-4 sm:p-6">
        <header className="space-y-2">
          <p className="text-sm">
            <Link href={spexHref(number.spex.id)} className="text-primary hover:underline">{spexName(number.spex)}</Link>
            <span className="text-muted-foreground"> · {t("number", { position: number.position })}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {number.title} {arrangement.trashed && <Badge variant="destructive">{t("trashed")}</Badge>}
          </h1>
          <p className="text-muted-foreground">
            {[number.originalSong ? t("melody", { song: number.originalSong }) : null,
              number.lyricist ? t("lyricist", { name: number.lyricist }) : null,
              number.composer ? t("composer", { name: number.composer }) : null].filter(Boolean).join(" · ")}
          </p>
          {arrangement.description && <p className="max-w-4xl whitespace-pre-line text-pretty">{arrangement.description}</p>}
          {editor && (
            <ParentActions kind="ARRANGEMENT" id={arrangement.id} trashed={arrangement.trashed} spexHref={spexHref(number.spex.id)}
                           fields={{ description: arrangement.description }} />
          )}
        </header>

        {arrangement.versions.length > 0 && (
          <section aria-labelledby="compare" className="space-y-2">
            <h2 id="compare" className="text-lg font-semibold">{t("versions")}</h2>
            <div className="overflow-x-auto">
              <ul className="flex gap-3 pb-2" aria-label={t("versions")}>
                {arrangement.versions.map(version => (
                  <li key={version.id} className="w-60 shrink-0 rounded-lg border bg-card p-3 text-sm" data-testid="version-card">
                    <a href={`#${versionAnchor(version.id)}`} className="font-medium hover:underline">{version.label}</a>
                    <div className="mt-1"><VersionBadges version={version} /></div>
                    <dl className="mt-2 space-y-1">
                      <dt className="text-xs text-muted-foreground">{t("key")}</dt>
                      <dd className="font-medium">{formatKeys(version.key, version.modulations, locale) ?? "–"}</dd>
                      <dt className="text-xs text-muted-foreground">{t("instrumentation")}</dt>
                      <dd>{instrumentationText(version.instrumentation, locale) || "–"}</dd>
                      {version.usedIn && (
                        <>
                          <dt className="text-xs text-muted-foreground">{t("usedIn")}</dt>
                          <dd>{spexName(version.usedIn)}</dd>
                        </>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {allParts.length > 0 && (
          <PartFilterControls instruments={data.instruments.filter(instrument => presentInstruments.has(instrument.id))}
                              pitches={PITCHES.filter(pitch => presentPitches.has(pitch))} />
        )}

        {arrangement.versions.length === 0 && <p className="text-muted-foreground">{t("noVersions")}</p>}

        {arrangement.versions.map(version => {
          const parts = version.files.filter(file => file.instruments.length > 0);
          const others = version.files.filter(file => file.instruments.length === 0);
          const partCount = version.allFiles.filter(file => file.instruments.length > 0).length;

          return (
            <section key={version.id} id={versionAnchor(version.id)} aria-labelledby={`title-${version.id}`}
                     className="scroll-mt-20 space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id={`title-${version.id}`} className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                  {version.label} <VersionBadges version={version} />
                </h2>
                {editor && (
                  <Button size="sm" variant="outline" nativeButton={false} render={<Link href={versionEditHref(version.id)} />}>
                    <Pencil /> {t("edit")}
                  </Button>
                )}
              </div>
              <VersionFacts version={version} />
              {!version.canOpen && <AccessRequest files={version.files.map(({ id, title }) => ({ id, title }))} />}
              {version.canOpen && version.allFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" nativeButton={false}
                          render={<a href={versionZipHref(version.id)} download data-umami-event="version-download" />}>
                    <Download /> {t("downloadVersion")}
                  </Button>
                  {partCount > 0 && (
                    <Button size="sm" variant="outline" nativeButton={false}
                            render={<a href={versionPartsZipHref(version.id, "")} download data-umami-event="parts-download" />}>
                      <Download /> {t("downloadAllParts", { count: partCount })}
                    </Button>
                  )}
                  {filtered && parts.length > 0 && (
                    <Button size="sm" nativeButton={false}
                            render={<a href={versionPartsZipHref(version.id, query)} download data-umami-event="filtered-parts-download" />}>
                      <Download /> {t("downloadFiltered", { count: parts.length })}
                    </Button>
                  )}
                </div>
              )}
              {!filtered && others.length > 0 && <FileList files={others} label={t("files")} />}
              {(parts.length > 0 || filtered) && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{filtered ? t("filteredParts", { count: parts.length }) : t("parts")}</h3>
                  <PartsByInstrument files={parts} />
                </div>
              )}
              {version.allFiles.length === 0 && <p className="text-sm text-muted-foreground">{t("noFiles")}</p>}
            </section>
          );
        })}
      </div>
    );
  });
}
