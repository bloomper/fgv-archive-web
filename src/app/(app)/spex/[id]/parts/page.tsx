import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FileRow } from "@/components/archive/file-list";
import { PartFilterControls } from "@/components/archive/part-filter.client";
import { ShareLinkButton } from "@/components/archive/share-link-dialog.client";
import { getMe, getSpexArrangements } from "@/lib/archive/archive.server";
import { isEditor } from "@/utils/auth";
import { ID, isEmptyFilter, partFilterFromParams, partFilterToApiQuery, toGraphqlFilter } from "@/utils/filters";
import { arrangementHref, spexHref, spexName, spexPartsZipHref } from "@/utils/links";
import { localName, noteName } from "@/utils/music";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

type Search = Record<string, string | string[] | undefined>;

/**
 * The parts of one or more instruments or transpositions across a spex' arrangements, in the order of the show, e.g.
 * every trumpet and trombone part, or every B♭ part, downloaded as one zip; editors can share them with a link that
 * also opens parts added later.
 */
export default async function SpexPartsPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  return withPolicyPage(Policies.app.requireAccess, async (authz) => {
    const { id } = await params;

    if (!ID.test(id)) {
      notFound();
    }

    const filter = partFilterFromParams(await searchParams);
    const [data, me] = await Promise.all([getSpexArrangements(id, toGraphqlFilter(filter)), getMe()]);
    const spex = data?.spex;

    if (!spex) {
      notFound();
    }

    const t = await getTranslations("SpexParts");
    const locale = await getLocale();
    const instruments = data.instruments;
    const chosen = instruments.filter(instrument => filter.instrumentIds.includes(instrument.id));
    // The version the zip takes: the one used in the spex, else the recommended one, else the newest the user may open
    const rows = spex.arrangements.map(arrangement => {
      const openable = arrangement.versions.filter(version => version.canOpen);
      const version = openable.find(candidate => candidate.usedInSpexId === spex.id)
        ?? openable.find(candidate => candidate.recommended) ?? openable[0];

      return { arrangement, version };
    });
    const count = rows.reduce((sum, row) => sum + (row.version?.files.length ?? 0), 0);
    const describe = [...chosen.map(instrument => localName(instrument, locale)),
      ...filter.transpositions.map(pitch => noteName(pitch, locale))].join(", ");

    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-1">
          <Link href={spexHref(spex.id)} className="text-sm text-primary hover:underline">← {spexName(spex)}</Link>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title", { spex: spexName(spex) })}</h1>
          <p className="max-w-4xl text-pretty text-sm text-muted-foreground">{t("text")}</p>
        </div>

        <PartFilterControls instruments={instruments} />

        <div className="flex flex-wrap items-center gap-2">
          {count > 0 && (
            <a href={spexPartsZipHref(spex.id, partFilterToApiQuery(filter))} download data-umami-event="spex-parts-download"
               className={buttonVariants()}>
              <Download /> {isEmptyFilter(filter) ? t("downloadAll") : t("download", { what: describe })}
            </a>
          )}
          <span className="text-sm text-muted-foreground" aria-live="polite">{t("count", { count })}</span>
          {isEditor(authz.roles) && (
            <ShareLinkButton input={{ spexId: spex.id, instrumentIds: filter.instrumentIds, transpositions: filter.transpositions }}
                             defaultName={`${spexName(spex)}${describe ? `, ${describe}` : ""}`}
                             maxMonths={me?.settings.maxShareLinkMonths ?? 24}
                             disabled={filter.instrumentIds.length === 0}
                             label={t("share")} />
          )}
        </div>
        {isEditor(authz.roles) && filter.instrumentIds.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("shareHint")}</p>
        )}

        <ol className="space-y-3" aria-label={t("arrangements")}>
          {rows.map(({ arrangement, version }) => (
            <li key={arrangement.id} className="space-y-1">
              <h2 className="text-sm font-semibold">
                {arrangement.number.position}.{" "}
                <Link href={arrangementHref(arrangement.id)} className="hover:underline">{arrangement.number.title}</Link>
                {version && <span className="font-normal text-muted-foreground"> · {version.label}</span>}
              </h2>
              {version && version.files.length > 0 ? (
                <ul className="divide-y rounded-lg border bg-card">
                  {version.files.map(file => <FileRow key={file.id} file={file} />)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">{t("noneHere")}</p>}
            </li>
          ))}
          {rows.length === 0 && <li className="text-muted-foreground">{t("none")}</li>}
        </ol>
      </div>
    );
  });
}
