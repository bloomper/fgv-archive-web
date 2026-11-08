import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FileList } from "@/components/archive/file-list";
import { AccessRequest } from "@/components/archive/access-request.client";
import { PdfReader } from "@/components/reader/pdf-reader.client";
import { CollapseSidebarOnTablet } from "@/components/reader/collapse-sidebar-on-tablet.client";
import { getFile, getFileVersion } from "@/lib/archive/archive.server";
import { ID } from "@/utils/filters";
import { fileDownloadHref, fileRawHref, isPdf, spexName, versionHref } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * A file: a PDF in the reader, at the page asked for (`?page=`), or the file's details and download; a lock and
 * "Ask for access" when the user may not open it.
 */
export default async function FilePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return withPolicyPage(Policies.app.requireAccess, async () => {
    const { id } = await params;
    const file = ID.test(id) ? await getFile(id) : null;

    if (!file) {
      notFound();
    }

    const t = await getTranslations("FilePage");
    const version = await getFileVersion(file.versionId);
    const page = Number((await searchParams).page);
    const parentTitle = version?.manuscript?.title ?? version?.arrangement?.number.title ?? "";
    const spex = version?.manuscript?.spex ?? version?.arrangement?.number.spex;
    const back = version ? versionHref(version) : "/";
    const subtitle = [parentTitle, version?.label, spexName(spex)].filter(Boolean).join(" · ");

    if (file.canOpen && isPdf(file)) {
      return (
        <>
          <CollapseSidebarOnTablet />
          <PdfReader src={fileRawHref(file.id)} title={file.title} subtitle={subtitle} downloadHref={fileDownloadHref(file.id)}
                     backHref={back} backLabel={t("back", { title: parentTitle })}
                     initialPage={Number.isInteger(page) && page > 0 ? page : 1} />
        </>
      );
    }

    return (
      <div className="max-w-3xl flex flex-1 flex-col gap-4 p-4 md:p-8">
        <Link href={back} className="w-fit text-sm text-primary hover:text-primary/80">← {subtitle}</Link>
        <h1 className="text-2xl font-bold tracking-tight">{file.title}</h1>
        <FileList files={[file]} />
        {file.canOpen ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("notReadable")}</p>
            <a href={fileDownloadHref(file.id)} download data-umami-event="file-download" className={buttonVariants()}>
              <Download /> {t("download")}
            </a>
          </div>
        ) : <AccessRequest files={[{ id: file.id, title: file.title }]} />}
      </div>
    );
  });
}
