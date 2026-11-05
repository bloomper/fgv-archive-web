import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { VersionBadges } from "@/components/archive/version-meta";
import { ShareLinkButton } from "@/components/archive/share-link-dialog.client";
import { RecordHistory } from "@/components/audit/change-log";
import { FileManager } from "@/components/editor/file-manager.client";
import { VersionForm } from "@/components/editor/version-form.client";
import { VersionState } from "@/components/editor/version-state.client";
import { getFileRoles, getInstruments, getMe, getVersion } from "@/lib/archive/archive.server";
import { isAdmin } from "@/utils/auth";
import { ID } from "@/utils/filters";
import { arrangementHref, manuscriptHref, spexName, versionHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { auditLink } from "@/app/(app)/manage/audit/links";

/**
 * An editor's page for a version: its fields, its state, its files (upload, edit, reorder, replace, delete), share
 * links and its latest changes.
 */
export default async function VersionEditPage({ params }: { params: Promise<{ id: string }> }) {
  return withPolicyPage(Policies.editor.requireEditor, async (authz) => {
    const { id } = await params;
    const version = ID.test(id) ? await getVersion(id) : null;

    if (!version) {
      notFound();
    }

    const t = await getTranslations("VersionEdit");
    const [roles, instruments, me] = await Promise.all([getFileRoles(), getInstruments(), getMe()]);
    const manuscript = version.manuscript;
    const number = version.arrangement?.number;
    const spex = manuscript?.spex ?? number?.spex;
    const base = number?.spex.original ?? spex;
    const family = manuscript
      ? [manuscript.spex, ...manuscript.spex.revivals]
      : number ? [base!, ...(number.spex.original ? [number.spex] : number.spex.revivals)] : [];
    const title = manuscript?.title ?? number?.title ?? "";
    const parentHref = manuscript ? manuscriptHref(manuscript.id) : arrangementHref(version.parentId);
    const maxShareLinkMonths = me?.settings.maxShareLinkMonths ?? 24;

    return (
      <div className="max-w-5xl space-y-8 p-4 sm:p-6">
        <header className="space-y-2">
          <p className="text-sm">
            <Link href={parentHref} className="text-primary hover:underline">← {title}</Link>
            <span className="text-muted-foreground"> · {spexName(spex)}</span>
          </p>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            {t("title", { label: version.label })} <VersionBadges version={version} />
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <VersionState id={version.id} published={version.published} recommended={version.recommended}
                          trashed={version.trashed} admin={isAdmin(authz.roles)} parentHref={parentHref} />
            <ShareLinkButton input={{ versionIds: [version.id] }} defaultName={`${title}, ${version.label}`}
                             maxMonths={maxShareLinkMonths} label={t("shareVersion")} />
            <Link href={versionHref(version)} className="px-2 text-sm text-primary hover:underline">{t("view")}</Link>
          </div>
        </header>

        <section aria-labelledby="files" className="space-y-3">
          <h2 id="files" className="text-lg font-semibold">{t("files")}</h2>
          <FileManager versionId={version.id} files={version.files} roles={roles} instruments={instruments}
                       maxUploadMb={me?.settings.maxUploadMb ?? 500} maxShareLinkMonths={maxShareLinkMonths}
                       shareName={`${title}, ${version.label}`} />
        </section>

        <section aria-labelledby="fields" className="space-y-3">
          <h2 id="fields" className="text-lg font-semibold">{t("fields")}</h2>
          <VersionForm key={version.lastModifiedAt ?? version.createdAt} version={version} spex={family}
                       instruments={instruments} />
        </section>

        <RecordHistory entityId={version.id} path="/manage/audit" linkOf={auditLink} />
      </div>
    );
  });
}
