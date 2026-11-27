import { getTranslations } from "next-intl/server";
import { getSpexipediaSync } from "@/lib/admin/admin.server";
import { formatInstant } from "@/utils/format";

/**
 * How the copy of Spexipedia's base data follows its change feed, and the changes that were left out after failing five
 * pulls in a row, so that an admin sees what the copy lacks.
 */
export async function SpexipediaSyncStatus() {
  const t = await getTranslations("AdminMaintenance.sync");
  const sync = await getSpexipediaSync();

  if (!sync) {
    return null;
  }

  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-labelledby="spexipedia-sync"
    >
      <h2
        id="spexipedia-sync"
        className="font-medium"
      >
        {t("title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("text")}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t("lastSuccess")}</dt>
        <dd>{formatInstant(sync.lastSuccess) ?? t("never")}</dd>
        {sync.lastError && (
          <>
            <dt className="text-muted-foreground">{t("lastError")}</dt>
            <dd className="text-destructive break-words">{sync.lastError}</dd>
          </>
        )}
      </dl>
      {sync.skipped.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noneSkipped")}</p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-destructive text-sm font-medium">{t("skipped", { count: sync.skipped.length })}</h3>
          <p className="text-muted-foreground text-sm">{t("skippedText")}</p>
          <ul className="space-y-2 text-sm">
            {sync.skipped.map((change) => (
              <li
                key={change.sequence}
                className="space-y-1 rounded-md border p-2"
              >
                <div>
                  {t("change", { change: change.change, kind: change.kind, at: formatInstant(change.skippedAt) ?? "" })}
                </div>
                <code className="text-xs break-all">{change.id}</code>
                <div className="text-muted-foreground break-words">{change.error}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
