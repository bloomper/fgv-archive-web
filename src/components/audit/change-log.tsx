import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAuditActors, getAuditLog } from "@/lib/admin/admin.server";
import { AuditTable, ChangeLogView } from "@/components/audit/change-log.client";
import { type AuditPage, type AuditSearch, auditHref, toAuditFilter, toAuditRows } from "@/utils/audit";

const PAGE_SIZE = 15;

type Props = {
  /** The change log's own address, for the record history's link. */
  path: string;
  search: AuditSearch;
  isAdmin: boolean;
  /** The record types this application logs. */
  entityTypes: readonly string[];
  /** Where a record can be seen, or null. */
  linkOf: (entityType: string, entityId: string) => string | null;
  /** A further page with the same filter, for "Load more". */
  loadMore: (search: AuditSearch, page: number, size: number) => Promise<AuditPage>;
};

/**
 * The change log: a toolbar whose filter travels in the address (so a filtered log can be linked to), the changes
 * newest first, each opening to what it was, and "Load more". Editors see their own changes, admins everyone's and
 * can narrow them to one person.
 */
export async function ChangeLog({ path, search, isAdmin, entityTypes, linkOf, loadMore }: Props) {
  const filter = toAuditFilter(search, isAdmin);
  const [log, actors] = await Promise.all([
    getAuditLog(0, PAGE_SIZE, filter),
    isAdmin ? getAuditActors() : Promise.resolve([]),
  ]);

  return (
    <ChangeLogView
      search={search}
      isAdmin={isAdmin}
      entityTypes={entityTypes}
      actors={actors}
      initial={{
        rows: toAuditRows(log?.entries ?? [], path, linkOf, !search.entity),
        totalCount: log?.totalCount ?? 0,
      }}
      pageSize={PAGE_SIZE}
      loadMore={loadMore}
    />
  );
}

/**
 * The latest changes of one record, for its edit page, with a link to all of them in the change log.
 */
export async function RecordHistory({
  entityId,
  path,
  linkOf,
}: {
  entityId: string;
  path: string;
  linkOf: Props["linkOf"];
}) {
  const t = await getTranslations("Audit");
  const log = await getAuditLog(0, 10, { entityId }).catch(() => null);

  if (!log || log.entries.length === 0) {
    return null;
  }
  return (
    <section
      className="space-y-3"
      aria-labelledby="record-history"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="record-history"
          className="text-lg font-semibold"
        >
          {t("recordHistory")}
        </h2>
        {log.totalCount > log.entries.length && (
          <Link
            href={auditHref(path, {}, { entity: entityId })}
            className="text-sm text-primary hover:text-primary/80"
          >
            {t("allChanges", { count: log.totalCount })}
          </Link>
        )}
      </div>
      <AuditTable rows={toAuditRows(log.entries, path, linkOf, false)} />
    </section>
  );
}
