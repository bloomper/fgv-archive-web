import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InstrumentBriefFragment } from "@/gql/graphql";
import { spexHref, spexName } from "@/utils/links";
import { formatKeys, type Key, localName } from "@/utils/music";

export type VersionLike = {
  label: string;
  recommended?: boolean;
  restricted?: boolean;
  published?: boolean;
  trashed?: boolean;
  usedIn?: { id: string; title?: string | null; year?: number | null } | null;
  date?: string | null;
  arranger?: string | null;
  key?: Key | null;
  modulations?: Key[];
  tempo?: string | null;
  duration?: string | null;
  notes?: string | null;
  instrumentation?: { count: number; instrument: InstrumentBriefFragment }[];
};

/**
 * A version's state as badges: recommended, restricted, unpublished, trashed.
 */
export function VersionBadges({ version }: { version: VersionLike }) {
  const t = useTranslations("Version");

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {version.recommended && <Badge><Star className="size-3" aria-hidden /> {t("recommended")}</Badge>}
      {version.restricted && <Badge variant="secondary"><Lock className="size-3" aria-hidden /> {t("restricted")}</Badge>}
      {version.published === false && <Badge variant="outline">{t("unpublished")}</Badge>}
      {version.trashed && <Badge variant="destructive">{t("trashed")}</Badge>}
    </span>
  );
}

/**
 * The key a version sounds in and the keys it modulates to, e.g. "F-dur → G-dur".
 */
export function KeyText({ keyValue, modulations = [] }: { keyValue?: Key | null; modulations?: Key[] }) {
  const locale = useLocale();

  return <>{formatKeys(keyValue, modulations, locale) ?? "–"}</>;
}

/**
 * "2 Trumpet, Trombon, Sång" in the admins' order.
 */
export function instrumentationText(instrumentation: VersionLike["instrumentation"], locale: string): string {
  return [...instrumentation ?? []].sort((a, b) => a.instrument.position - b.instrument.position)
    .map(({ count, instrument }) => `${count > 1 ? `${count} ` : ""}${localName(instrument, locale)}`)
    .join(", ");
}

/**
 * A version's fields as a description list; empty fields are left out.
 */
export function VersionFacts({ version, showSpex = true }: { version: VersionLike; showSpex?: boolean }) {
  const t = useTranslations("Version");
  const locale = useLocale();
  const instrumentation = instrumentationText(version.instrumentation, locale);
  const keys = formatKeys(version.key, version.modulations ?? [], locale);
  const rows: [string, React.ReactNode][] = [];

  if (showSpex && version.usedIn) {
    rows.push([t("usedIn"), <Link key="spex" href={spexHref(version.usedIn.id)} className="hover:text-primary">{spexName(version.usedIn)}</Link>]);
  }
  if (keys) {
    rows.push([t("key"), <span key="key" data-testid="version-key">{keys}</span>]);
  }
  if (version.arranger) {
    rows.push([t("arranger"), version.arranger]);
  }
  if (instrumentation) {
    rows.push([t("instrumentation"), instrumentation]);
  }
  if (version.tempo) {
    rows.push([t("tempo"), version.tempo]);
  }
  if (version.duration) {
    rows.push([t("duration"), version.duration]);
  }
  if (version.date) {
    rows.push([t("date"), version.date]);
  }

  return (
    <div className="space-y-2 text-sm">
      {rows.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {rows.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {version.notes && <p className="whitespace-pre-line text-pretty text-muted-foreground">{version.notes}</p>}
    </div>
  );
}
