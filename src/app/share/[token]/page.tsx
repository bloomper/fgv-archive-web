import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FileList, PartsByInstrument } from "@/components/archive/file-list";
import { VersionFacts } from "@/components/archive/version-meta";
import { PartFilterControls } from "@/components/archive/part-filter.client";
import { getSharedView } from "@/lib/share/share.server";
import { formatDate } from "@/utils/format";
import { isEmptyFilter, partFilterFromParams, partFilterToApiQuery, toGraphqlFilter } from "@/utils/filters";
import { sharePartsZipHref, spexName, versionPartsZipHref, versionZipHref } from "@/utils/links";
import { localName, noteName, PITCHES } from "@/utils/music";
import { SharedGone } from "./gone";

type Search = Record<string, string | string[] | undefined>;

/**
 * What a share link opens, for anyone with the link and without logging in: the spex, the shared versions and their
 * files, read in the page or downloaded one by one, a version at a time, or as parts narrowed by instruments and
 * transpositions.
 */
export default async function SharePage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Search>;
}) {
  const { token } = await params;
  const filter = partFilterFromParams(await searchParams);
  const view = await getSharedView(token, toGraphqlFilter(filter));

  if (!view) {
    return <SharedGone status="UNKNOWN" />;
  }
  if (view.status !== "VALID") {
    return <SharedGone status={view.status} createdByName={view.createdByName} />;
  }

  const t = await getTranslations("SharePage");
  const locale = await getLocale();
  const filtered = !isEmptyFilter(filter);
  const place = { share: token };
  // The choices come from every shared part, whatever the filter; the server narrows each version's files
  const parts = view.versions.flatMap(version => version.allFiles).filter(file => file.instruments.length > 0);
  const instruments = [...new Map(parts.flatMap(file => file.instruments).map(instrument => [instrument.id, instrument])).values()];
  const pitches = PITCHES.filter(pitch => parts.some(file => file.transposition?.pitch === pitch));
  // A link made for instruments opens its spex' parts, also as one zip in the order of the show
  const forInstruments = view.spex !== null && view.spex !== undefined;
  const query = partFilterToApiQuery(filter);
  const spexNames = [...new Set(view.versions.map(version => spexName(version.spex)).filter(Boolean))];
  const versions = [...view.versions].sort((a, b) =>
    (a.kind === b.kind ? 0 : a.kind === "MANUSCRIPT" ? -1 : 1) || (a.numberPosition ?? 0) - (b.numberPosition ?? 0));

  return (
    <div className="mx-auto max-w-5xl flex flex-1 flex-col gap-6 p-4 md:p-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{spexNames.join(", ")}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{view.name}</h1>
        <p className="text-sm text-muted-foreground">
          {t("sharedBy", { name: view.createdByName ?? "–", date: formatDate(view.expiresAt) ?? "" })}
        </p>
        {view.spex && (
          <p className="text-sm" data-testid="made-for">
            {t("madeFor", {
              what: [...view.instruments.map(instrument => localName(instrument, locale)),
                ...view.transpositions.map(pitch => noteName(pitch, locale))].join(", "),
              spex: spexName(view.spex),
            })}
          </p>
        )}
      </header>

      {parts.length > 0 && (
        <PartFilterControls instruments={instruments} pitches={pitches} />
      )}
      {forInstruments && (
        <a href={sharePartsZipHref(token, query)} download className={buttonVariants()}>
          <Download /> {filtered ? t("downloadFilteredShow") : t("downloadAllShow")}
        </a>
      )}

      {versions.map(version => {
        const versionParts = version.allFiles.filter(file => file.instruments.length > 0);
        const shownParts = version.files.filter(file => file.instruments.length > 0);
        const others = version.files.filter(file => file.instruments.length === 0);

        return (
          <section key={version.id} className="space-y-3 rounded-lg border p-4" aria-labelledby={`shared-${version.id}`}
                   data-testid="shared-version">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">
                {[version.kind === "MANUSCRIPT" ? t("manuscript") : version.numberPosition ? t("number", { position: version.numberPosition }) : t("arrangement"),
                  spexName(version.spex)].filter(Boolean).join(" · ")}
              </p>
              <h2 id={`shared-${version.id}`} className="text-lg font-semibold">
                {version.title} <span className="font-normal text-muted-foreground">· {version.label}</span>
              </h2>
              {(version.authors || version.originalSong) && (
                <p className="text-sm text-muted-foreground">
                  {[version.authors, version.originalSong, [version.lyricist, version.composer].filter(Boolean).join(" / ")].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <VersionFacts version={{ ...version, usedIn: null }} showSpex={false} />
            <div className="flex flex-wrap gap-2">
              <a href={versionZipHref(version.id, place)} download className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Download /> {t("downloadVersion")}
              </a>
              {versionParts.length > 0 && filtered && shownParts.length > 0 && (
                <a href={versionPartsZipHref(version.id, query, place)} download className={buttonVariants({ size: "sm" })}>
                  <Download /> {t("downloadFiltered", { count: shownParts.length })}
                </a>
              )}
              {versionParts.length > 0 && !filtered && others.length > 0 && (
                <a href={versionPartsZipHref(version.id, "", place)} download className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Download /> {t("downloadAllParts", { count: versionParts.length })}
                </a>
              )}
            </div>
            {!filtered && others.length > 0 && <FileList files={others} place={place} label={t("files")} />}
            {versionParts.length > 0 && (filtered || shownParts.length > 0) && <PartsByInstrument files={shownParts} place={place} />}
          </section>
        );
      })}
    </div>
  );
}
