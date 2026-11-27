import { getLocale, getTranslations } from "next-intl/server";
import { getStorage } from "@/lib/admin/admin.server";
import { formatBytes } from "@/utils/links";
import { Policies } from "@/utils/policy.server";
import { withPolicyPage } from "@/utils/route.server";
import { Page, PageHeader } from "@bloomper/fgv-web-ui/shell/page-header";

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
    const share = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;

    return (
      <Page
        variant="content"
        className="max-w-2xl"
      >
        <PageHeader title={t("title")} />
        {storage && (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("files")}</dt>
              <dd>
                {formatBytes(storage.filesBytes, locale)} ({t("fileCount", { count: storage.fileCount })})
              </dd>
              <dt className="text-muted-foreground">{t("previews")}</dt>
              <dd>{formatBytes(storage.previewsBytes, locale)}</dd>
              <dt className="text-muted-foreground">{t("free")}</dt>
              <dd>{formatBytes(storage.freeBytes, locale)}</dd>
            </dl>
            <div className="space-y-1">
              <div
                className="bg-muted h-3 overflow-hidden rounded-full"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
                aria-label={t("used")}
              >
                <div
                  className="bg-primary h-full"
                  style={{ width: `${share}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">{t("share", { share })}</p>
            </div>
          </>
        )}
      </Page>
    );
  });
}
