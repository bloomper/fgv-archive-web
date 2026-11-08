import { getLocale, getTranslations } from "next-intl/server";
import { getStorage } from "@/lib/admin/admin.server";
import { formatBytes } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";

/**
 * Space used by files and previews, and left on the volume.
 */
export default async function StoragePage() {
  return withPolicyPage(Policies.admin.requireAdmin, async () => {
    const t = await getTranslations("AdminStorage");
    const locale = await getLocale();
    const storage = await getStorage();
    const used = (storage?.filesBytes ?? 0) + (storage?.previewsBytes ?? 0);
    const total = used + (storage?.freeBytes ?? 0);
    const share = total > 0 ? Math.round(used / total * 1000) / 10 : 0;

    return (
      <div className="max-w-2xl flex flex-1 flex-col gap-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        {storage && (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("files")}</dt>
              <dd>{formatBytes(storage.filesBytes, locale)} ({t("fileCount", { count: storage.fileCount })})</dd>
              <dt className="text-muted-foreground">{t("previews")}</dt>
              <dd>{formatBytes(storage.previewsBytes, locale)}</dd>
              <dt className="text-muted-foreground">{t("free")}</dt>
              <dd>{formatBytes(storage.freeBytes, locale)}</dd>
            </dl>
            <div className="space-y-1">
              <div className="h-3 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100}
                   aria-valuenow={share} aria-label={t("used")}>
                <div className="h-full bg-primary" style={{ width: `${share}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{t("share", { share })}</p>
            </div>
          </>
        )}
      </div>
    );
  });
}
