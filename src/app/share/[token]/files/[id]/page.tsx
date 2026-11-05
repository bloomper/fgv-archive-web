import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfReader } from "@/components/reader/pdf-reader.client";
import { getSharedView } from "@/lib/share/share.server";
import { fileDownloadHref, fileRawHref, isPdf, spexName } from "@/utils/links";
import { SharedGone } from "../../gone";

/**
 * A PDF that a share link opens, in the reader; other files are downloaded.
 */
export default async function SharedFilePage({ params, searchParams }: {
  params: Promise<{ token: string; id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { token, id } = await params;
  const view = await getSharedView(token);

  if (!view) {
    return <SharedGone status="UNKNOWN" />;
  }
  if (view.status !== "VALID") {
    return <SharedGone status={view.status} createdByName={view.createdByName} />;
  }

  const version = view.versions.find(candidate => candidate.files.some(file => file.id === id));
  const file = version?.files.find(candidate => candidate.id === id);

  if (!version || !file) {
    notFound();
  }

  const t = await getTranslations("SharePage");
  const place = { share: token };
  const page = Number((await searchParams).page);

  if (!isPdf(file)) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">{file.title}</h1>
        <Button nativeButton={false} render={<a href={fileDownloadHref(file.id, place)} download />}><Download /> {t("download")}</Button>
      </div>
    );
  }
  return (
    <PdfReader src={fileRawHref(file.id, place)} title={file.title}
               subtitle={[version.title, version.label, spexName(version.spex)].filter(Boolean).join(" · ")}
               downloadHref={fileDownloadHref(file.id, place)} backHref={`/share/${token}`} backLabel={t("back")}
               initialPage={Number.isInteger(page) && page > 0 ? page : 1} />
  );
}
