import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Download, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FileList } from "@/components/archive/file-list";
import { VersionBadges, VersionFacts } from "@/components/archive/version-meta";
import { AccessRequest } from "@/components/archive/access-request.client";
import { ParentActions } from "@/components/archive/parent-actions.client";
import { getManuscript } from "@/lib/archive/archive.server";
import { isEditor } from "@/utils/auth";
import { ID } from "@/utils/filters";
import { arrangementHref, spexHref, spexName, versionAnchor, versionEditHref, versionZipHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * A manuscript: its versions, the recommended one first, each with its files and the numbers of the spex it was used
 * in, linked to their arrangements.
 */
export default async function ManuscriptPage({ params }: { params: Promise<{ id: string }> }) {
  return withPolicyPage(Policies.app.requireAccess, async (authz) => {
    const { id } = await params;
    const manuscript = ID.test(id) ? await getManuscript(id) : null;

    if (!manuscript) {
      notFound();
    }

    const t = await getTranslations("ManuscriptPage");
    const editor = isEditor(authz.roles);

    return (
      <div className="space-y-8 p-4 sm:p-6">
        <header className="space-y-2">
          <p className="text-sm">
            <Link href={spexHref(manuscript.spex.id)} className="text-primary hover:underline">{spexName(manuscript.spex)}</Link>
            <span className="text-muted-foreground"> · {t("manuscript")}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {manuscript.title} {manuscript.trashed && <Badge variant="destructive">{t("trashed")}</Badge>}
          </h1>
          {manuscript.authors && <p className="text-muted-foreground">{t("by", { authors: manuscript.authors })}</p>}
          {manuscript.description && <p className="max-w-4xl whitespace-pre-line text-pretty">{manuscript.description}</p>}
          {editor && (
            <ParentActions kind="MANUSCRIPT" id={manuscript.id} trashed={manuscript.trashed} spexHref={spexHref(manuscript.spex.id)}
                           fields={{ title: manuscript.title, authors: manuscript.authors, description: manuscript.description }} />
          )}
        </header>

        {manuscript.versions.length === 0 && <p className="text-muted-foreground">{t("noVersions")}</p>}

        {manuscript.versions.map(version => (
          <section key={version.id} id={versionAnchor(version.id)} aria-labelledby={`title-${version.id}`}
                   className="scroll-mt-20 space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id={`title-${version.id}`} className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                {version.label} <VersionBadges version={version} />
              </h2>
              <div className="flex flex-wrap gap-2">
                {version.canOpen && version.files.length > 0 && (
                  <a href={versionZipHref(version.id)} download data-umami-event="version-download" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Download /> {t("downloadVersion")}
                  </a>
                )}
                {editor && (
                  <Link href={versionEditHref(version.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Pencil /> {t("edit")}
                  </Link>
                )}
              </div>
            </div>
            <VersionFacts version={version} />
            {!version.canOpen && <AccessRequest files={version.files.map(({ id, title }) => ({ id, title }))} />}
            {version.files.length > 0
              ? <FileList files={version.files} label={t("filesOf", { label: version.label })} />
              : <p className="text-sm text-muted-foreground">{t("noFiles")}</p>}
            {version.usedIn && version.usedIn.numbers.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">{t("numbers", { count: version.usedIn.numbers.length })}</summary>
                <ol className="mt-2 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                  {version.usedIn.numbers.map(number => (
                    <li key={number.id}>
                      <span className="tabular-nums text-muted-foreground">{number.position}. </span>
                      {number.arrangement
                        ? <Link href={arrangementHref(number.arrangement.id)} className="text-primary hover:underline">{number.title}</Link>
                        : number.title}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </section>
        ))}
      </div>
    );
  });
}
