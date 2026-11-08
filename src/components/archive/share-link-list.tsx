import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { ShareLinkActions } from "@/components/archive/share-link-actions.client";
import { getShareLinks } from "@/lib/admin/admin.server";
import { getMe } from "@/lib/archive/archive.server";
import { formatDate } from "@/utils/format";
import { fileHref, spexHref, spexName, versionHref } from "@/utils/links";
import { localName, noteName } from "@/utils/music";

/**
 * Share links, newest first: who they are for, what they open, when they expire and how often each file was
 * downloaded through them. The token is never shown again; only the link's maker (or an admin) extends or revokes it.
 */
export async function ShareLinkList({ all }: { all: boolean }) {
  const t = await getTranslations("ShareLinks");
  const locale = await getLocale();
  const [links, me] = await Promise.all([getShareLinks(all), getMe()]);
  const maxMonths = me?.settings.maxShareLinkMonths ?? 24;

  if (links.length === 0) {
    return <p className="text-muted-foreground">{t("none")}</p>;
  }
  return (
    <ul className="space-y-3">
      {links.map(link => (
        <li key={link.id} className="space-y-2 rounded-lg border bg-card p-3" data-testid="share-link">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {link.name}
                <Badge variant={link.status === "VALID" ? "default" : link.status === "REVOKED" ? "destructive" : "secondary"}>
                  {t(`status.${link.status}`)}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                {[all ? t("by", { name: link.createdByName ?? link.createdById }) : null,
                  t("created", { date: formatDate(link.createdAt) ?? "" }),
                  link.revokedAt ? t("revokedAt", { date: formatDate(link.revokedAt) ?? "", name: link.revokedByName ?? "" })
                    : t("expires", { date: formatDate(link.expiresAt) ?? "" }),
                  t("downloads", { count: link.downloadCount })].filter(Boolean).join(" · ")}
              </p>
            </div>
            <ShareLinkActions id={link.id} name={link.name} revoked={link.status === "REVOKED"} maxMonths={maxMonths} />
          </div>
          <ul className="space-y-0.5 text-sm">
            {link.spex && (
              <li>
                <Link href={spexHref(link.spex.id)} className="text-primary hover:text-primary/80">{spexName(link.spex)}</Link>
                {": "}{[...link.instruments.map(instrument => localName(instrument, locale)),
                  ...link.transpositions.map(pitch => noteName(pitch, locale))].join(", ")}
              </li>
            )}
            {link.versions.map(version => (
              <li key={version.id}>
                <Link href={versionHref({ ...version, parentId: version.manuscript?.id ?? version.arrangement?.id ?? "" })}
                      className="text-primary hover:text-primary/80">
                  {version.manuscript?.title ?? version.arrangement?.number.title}
                </Link>
                <span className="text-muted-foreground"> · {version.label}</span>
              </li>
            ))}
            {link.files.map(file => (
              <li key={file.id}><Link href={fileHref(file.id)} className="text-primary hover:text-primary/80">{file.title}</Link></li>
            ))}
          </ul>
          {link.downloads.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">{t("perFile")}</summary>
              <ul className="mt-1 space-y-0.5">
                {link.downloads.map(download => (
                  <li key={download.file.id} className="flex justify-between gap-2">
                    <span>{download.file.title}</span>
                    <span className="tabular-nums text-muted-foreground">{download.count}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
