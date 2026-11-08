import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FileMusic, ScrollText } from "lucide-react";
import { HomeSection } from "@/components/home-section";
import { VersionBadges } from "@/components/archive/version-meta";
import { YearBrowser } from "@/components/year-browser.client";
import { getHome, getMe } from "@/lib/archive/archive.server";
import { formatDate } from "@/utils/format";
import { arrangementHref, manuscriptHref, spexName, versionAnchor } from "@/utils/links";
import { formatKeys } from "@/utils/music";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { DataEmpty } from "@/components/data-empty";

/**
 * The start page: a greeting with the admins' text, browsing by category and year (folded into decades), and the
 * versions added or changed most recently.
 */
export default async function HomePage() {
  return withPolicyPage(Policies.app.requireAccess, async () => {
    const t = await getTranslations("Home");
    const locale = await getLocale();
    const [home, me] = await Promise.all([getHome(), getMe()]);
    const welcome = locale === "en" ? me?.settings.welcomeEn : me?.settings.welcomeSv;
    const chip = "rounded-full border px-3 py-1 text-sm hover:bg-accent";

    return (
      <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        <section className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("greeting", { name: me?.me.displayName ?? me?.me.username ?? "" })}
          </h1>
          <p className="max-w-4xl whitespace-pre-line text-pretty text-muted-foreground">{welcome || t("intro")}</p>
        </section>

        {home && (
          <nav aria-label={t("browse")} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {home.categories.map(category => (
                <Link key={category.id} href={`/spex?category=${category.id}`} className={chip}>
                  {category.name} <span className="ml-1 text-muted-foreground">{category.spexCount}</span>
                </Link>
              ))}
              <Link href="/spex?material=1" className={chip}>{t("withMaterial")}</Link>
            </div>
            <YearBrowser years={home.years} hrefPrefix="/spex?year=" />
          </nav>
        )}

        <HomeSection id="recent" title={t("recent")} more={{ href: "/spex?material=1", label: t("allSpex") }}>
          {home && home.recentVersions.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {home.recentVersions.map(version => {
                const manuscript = version.manuscript;
                const number = version.arrangement?.number;
                const href = `${manuscript ? manuscriptHref(version.parentId) : arrangementHref(version.parentId)}#${versionAnchor(version.id)}`;
                const spex = manuscript?.spex ?? number?.spex;
                const keys = formatKeys(version.key, version.modulations, locale);

                return (
                  <li key={version.id} className="min-w-0">
                    <Link href={href} className="flex h-full gap-3 rounded-lg border bg-card p-3 hover:bg-accent">
                      {manuscript
                        ? <ScrollText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                        : <FileMusic className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />}
                      <span className="block min-w-0 flex-1 space-y-0.5">
                        <span className="block truncate font-medium">{manuscript?.title ?? number?.title}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {[manuscript ? t("manuscript") : t("arrangement"), spexName(spex), version.label].filter(Boolean).join(" · ")}
                        </span>
                        <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          {keys && <span>{keys}</span>}
                          <span>{formatDate(version.lastModifiedAt ?? version.publishedAt ?? version.createdAt)}</span>
                          <VersionBadges version={version} />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : <DataEmpty title={t("empty")} description={null} />}
        </HomeSection>
      </div>
    );
  });
}
