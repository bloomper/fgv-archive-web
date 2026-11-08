import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { BookOpen, Download, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FileFieldsFragment, InstrumentBriefFragment } from "@/gql/graphql";
import { fileDownloadHref, fileHref, formatBytes, isPdf, type Place, previewHref } from "@/utils/links";
import { formatTransposition, localName } from "@/utils/music";

export type ArchiveFile = FileFieldsFragment;

/**
 * The instruments a part carries, in order, e.g. "Flöjt / Piccolaflöjt", with its desk.
 */
export function instrumentsText(file: Pick<ArchiveFile, "instruments" | "desk">, locale: string): string {
  const names = file.instruments.map(instrument => localName(instrument, locale)).join(" / ");

  return [names, file.desk].filter(Boolean).join(" ");
}

/**
 * One file: its preview, title, role, the instruments, desk and transposition of a part, pages and size, and how to
 * read or download it; a lock instead when the user may not open it.
 */
export function FileRow({ file, place = {}, showInstruments = true, lead }: {
  file: ArchiveFile;
  place?: Place;
  showInstruments?: boolean;
  /** Shown before the title, e.g. the desk in a list grouped by instrument. */
  lead?: string;
}) {
  const t = useTranslations("Files");
  const locale = useLocale();
  const transposition = formatTransposition(file.transposition, locale);
  const instruments = showInstruments ? instrumentsText(file, locale) : null;
  const readable = file.canOpen && isPdf(file);

  return (
    <li className="link-row flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2" data-testid="file-row">
      <div className="hidden size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-white sm:flex">
        {file.canOpen && file.hasPreview
          // eslint-disable-next-line @next/next/no-img-element -- the preview comes through a route handler with the session
          ? <img src={previewHref(file.id, place)} alt="" loading="lazy" className="size-full object-cover object-top" />
          : <FileText className="size-5 text-muted-foreground" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {readable
            ? <Link href={fileHref(file.id, place)} className="row-link font-medium">{lead ? `${lead} · ` : ""}{file.title}</Link>
            : <span className="font-medium">{lead ? `${lead} · ` : ""}{file.title}</span>}
          <Badge variant="outline">{localName(file.role, locale)}</Badge>
          {transposition && <Badge variant="secondary" title={t("transposition")}>{t("inPitch", { pitch: transposition })}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {[instruments, file.pages ? t("pages", { count: file.pages }) : null, file.extension.toUpperCase(),
            formatBytes(file.size, locale)].filter(Boolean).join(" · ")}
          {file.comment ? ` · ${file.comment}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {file.canOpen ? (
          <>
            {readable && (
              <Link href={fileHref(file.id, place)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm hover:bg-accent"
                    aria-label={t("readOf", { title: file.title })}>
                <BookOpen className="size-4" /> <span className="hidden sm:inline">{t("read")}</span>
              </Link>
            )}
            <a href={fileDownloadHref(file.id, place)} download data-umami-event="file-download"
               className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm hover:bg-accent"
               aria-label={t("downloadOf", { title: file.title })}>
              <Download className="size-4" /> <span className="hidden sm:inline">{t("download")}</span>
            </a>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground" title={t("locked")}>
            <Lock className="size-4" aria-hidden /> <span>{t("locked")}</span>
          </span>
        )}
      </div>
    </li>
  );
}

export function FileList({ files, place, label }: { files: ArchiveFile[]; place?: Place; label?: string }) {
  if (files.length === 0) {
    return null;
  }
  return (
    <ul aria-label={label} className="divide-y overflow-hidden rounded-lg border bg-card">
      {files.map(file => <FileRow key={file.id} file={file} place={place} />)}
    </ul>
  );
}

/**
 * The instruments of some parts, each once, in the admins' order.
 */
export function instrumentsOf(files: { instruments: InstrumentBriefFragment[] }[]): InstrumentBriefFragment[] {
  const byId = new Map<string, InstrumentBriefFragment>();

  for (const file of files) {
    for (const instrument of file.instruments) {
      byId.set(instrument.id, instrument);
    }
  }
  return [...byId.values()].sort((a, b) => a.position - b.position);
}

/**
 * Parts listed by instrument: a part that carries several instruments is listed under each of them, so that every
 * musician finds theirs. Within an instrument, by desk.
 */
export function PartsByInstrument({ files, place }: { files: ArchiveFile[]; place?: Place }) {
  const t = useTranslations("Files");
  const locale = useLocale();
  const instruments = instrumentsOf(files);

  return (
    <div className="space-y-3">
      {instruments.map(instrument => {
        const parts = files.filter(file => file.instruments.some(item => item.id === instrument.id))
          .sort((a, b) => (a.desk ?? "").localeCompare(b.desk ?? "", locale) || a.position - b.position);

        return (
          <section key={instrument.id} aria-label={localName(instrument, locale)} data-testid="instrument-group">
            <h4 className="mb-1 text-sm font-semibold">{localName(instrument, locale)}</h4>
            <ul className="divide-y rounded-lg border bg-card">
              {parts.map(file => <FileRow key={file.id} file={file} place={place} />)}
            </ul>
          </section>
        );
      })}
      {instruments.length === 0 && <p className="text-sm text-muted-foreground">{t("noParts")}</p>}
    </div>
  );
}
