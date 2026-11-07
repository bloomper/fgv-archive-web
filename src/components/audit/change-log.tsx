import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditActors, getAuditLog } from "@/lib/admin/admin.server";
import { AUDIT_ACTIONS, auditHref, type AuditSearch, startOfDay } from "@/utils/audit";
import { formatInstant } from "@/utils/format";

const SIZE = 50;

type Entry = {
  id: string;
  at: string;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string
};

type Props = {
  /** The change log's own address, for the filter form and paging. */
  path: string;
  search: AuditSearch;
  isAdmin: boolean;
  /** The record types this application logs. */
  entityTypes: readonly string[];
  /** Where a record can be seen, or null. */
  linkOf: (entityType: string, entityId: string) => string | null;
};

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  return action === "DELETE" || action === "TRASH" || action === "REVOKE" ? "destructive"
    : action === "CREATE" || action === "PUBLISH" || action === "SHARE" ? "default"
      : action === "UPDATE" ? "secondary" : "outline";
}

/**
 * One change as a row: when, who, what happened to which kind of record, and the summary, linked to the record while it
 * exists.
 */
async function EntryRow({ entry, linkOf, historyHref }: {
  entry: Entry;
  linkOf: Props["linkOf"];
  historyHref?: string
}) {
  const t = await getTranslations("Audit");
  const link = entry.entityId && entry.action !== "DELETE" ? linkOf(entry.entityType, entry.entityId) : null;

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap align-top tabular-nums">{formatInstant(entry.at)}</TableCell>
      <TableCell className="align-top">{entry.actorName ?? "–"}</TableCell>
      <TableCell className="align-top">
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={actionVariant(entry.action)}>{t.has(`action.${entry.action}`) ? t(`action.${entry.action}`) : entry.action}</Badge>
          <Badge
            variant="outline">{t.has(`type.${entry.entityType}`) ? t(`type.${entry.entityType}`) : entry.entityType}</Badge>
        </div>
      </TableCell>
      <TableCell className="align-top">
        {link ? <Link href={link} className="hover:underline">{entry.summary}</Link> : entry.summary}
        {historyHref && (
          <Link href={historyHref} className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                aria-label={t("historyOf", { summary: entry.summary })}>
            <History className="size-3" />{t("history")}
          </Link>
        )}
      </TableCell>
    </TableRow>
  );
}

async function EntryTable({ entries, linkOf, historyHref }: {
  entries: Entry[];
  linkOf: Props["linkOf"];
  historyHref?: (entry: Entry) => string | undefined
}) {
  const t = await getTranslations("Audit");

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("when")}</TableHead>
            <TableHead>{t("who")}</TableHead>
            <TableHead>{t("event")}</TableHead>
            <TableHead>{t("what")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(entry => <EntryRow key={entry.id} entry={entry} linkOf={linkOf}
                                          historyHref={historyHref?.(entry)} />)}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * The change log: filters that travel in the address (so a filtered log can be linked to), the changes newest first,
 * and pages. Editors see their own changes, admins everyone's and can narrow them to one person.
 */
export async function ChangeLog({ path, search, isAdmin, entityTypes, linkOf }: Props) {
  const t = await getTranslations("Audit");
  const requested = Number(search.page ?? "0");
  const page = Number.isInteger(requested) && requested >= 0 ? requested : 0;
  const filter = {
    entityType: search.type || null,
    action: search.action || null,
    actorId: isAdmin ? search.actor || null : null,
    from: startOfDay(search.from),
    to: startOfDay(search.to, 1),
    q: search.q?.trim().slice(0, 100) || null,
    entityId: search.entity || null,
  };
  const [log, actors] = await Promise.all([getAuditLog(page, SIZE, filter), isAdmin ? getAuditActors() : Promise.resolve([])]);
  const pages = Math.max(1, Math.ceil((log?.totalCount ?? 0) / SIZE));
  const filtered = Object.values(filter).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Keyed by the filter: its fields are uncontrolled, and a new filter must show in them */}
      <form key={auditHref(path, search, { page: undefined })} method="get" action={path} role="search"
            aria-label={t("filters")}
            className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]">
        {search.entity && <input type="hidden" name="entity" value={search.entity} />}
        <div className="flex flex-col justify-end gap-1.5">
          <Label htmlFor="audit-q">{t("search")}</Label>
          <Input id="audit-q" name="q" type="search" defaultValue={search.q ?? ""} maxLength={100} />
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <Label htmlFor="audit-type">{t("typeLabel")}</Label>
          <NativeSelect id="audit-type" name="type" defaultValue={search.type ?? ""} className="w-full">
            <NativeSelectOption value="">{t("allTypes")}</NativeSelectOption>
            {entityTypes.map(type => <NativeSelectOption key={type}
                                                         value={type}>{t(`type.${type}`)}</NativeSelectOption>)}
          </NativeSelect>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <Label htmlFor="audit-action">{t("actionLabel")}</Label>
          <NativeSelect id="audit-action" name="action" defaultValue={search.action ?? ""} className="w-full">
            <NativeSelectOption value="">{t("allActions")}</NativeSelectOption>
            {AUDIT_ACTIONS.map(action => <NativeSelectOption key={action}
                                                             value={action}>{t(`action.${action}`)}</NativeSelectOption>)}
          </NativeSelect>
        </div>
        {isAdmin ? (
          <div className="flex flex-col justify-end gap-1.5">
            <Label htmlFor="audit-actor">{t("who")}</Label>
            <NativeSelect id="audit-actor" name="actor" defaultValue={search.actor ?? ""} className="w-full">
              <NativeSelectOption value="">{t("everyone")}</NativeSelectOption>
              {actors.map(actor => <NativeSelectOption key={actor.id}
                                                       value={actor.id}>{actor.name ?? actor.id}</NativeSelectOption>)}
            </NativeSelect>
          </div>
        ) : <div className="hidden lg:block" />}
        <div className="flex flex-col justify-end gap-1.5">
          <Label htmlFor="audit-from">{t("from")}</Label>
          <Input id="audit-from" name="from" type="date" defaultValue={search.from ?? ""} />
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <Label htmlFor="audit-to">{t("to")}</Label>
          <Input id="audit-to" name="to" type="date" defaultValue={search.to ?? ""} />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit">{t("filter")}</Button>
          {filtered && <Link href={path} className="px-3 py-2 text-sm text-primary hover:underline">{t("reset")}</Link>}
        </div>
      </form>
      {search.entity && (
        <p className="text-sm text-muted-foreground">
          {t("oneRecord")} <Link href={auditHref(path, search, { entity: undefined, page: undefined })}
                                 className="text-primary hover:underline">{t("allRecords")}</Link>
        </p>
      )}
      {/* One line when there is nothing: the count ("Inga ändringar") would only repeat the message */}
      {log && log.entries.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">{t("count", { count: log.totalCount })}</p>
          <EntryTable entries={log.entries} linkOf={linkOf}
                      historyHref={entry => entry.entityId && !search.entity ? auditHref(path, {}, { entity: entry.entityId }) : undefined} />
        </>
      ) : <p className="text-muted-foreground" aria-live="polite">{filtered ? t("noneFiltered") : t("none")}</p>}
      {pages > 1 && (
        <nav className="flex items-center gap-3 text-sm" aria-label={t("pages")}>
          {page > 0 && <Link href={auditHref(path, search, { page: String(page - 1) })}
                             className="text-primary hover:underline">{t("newer")}</Link>}
          <span className="text-muted-foreground">{t("pageOf", { page: page + 1, pages })}</span>
          {page + 1 < pages && <Link href={auditHref(path, search, { page: String(page + 1) })}
                                     className="text-primary hover:underline">{t("older")}</Link>}
        </nav>
      )}
    </div>
  );
}

/**
 * The latest changes of one record, for its edit page, with a link to all of them in the change log.
 */
export async function RecordHistory({ entityId, path, linkOf }: {
  entityId: string;
  path: string;
  linkOf: Props["linkOf"]
}) {
  const t = await getTranslations("Audit");
  const log = await getAuditLog(0, 10, { entityId }).catch(() => null);

  if (!log || log.entries.length === 0) {
    return null;
  }
  return (
    <section className="space-y-3" aria-labelledby="record-history">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="record-history" className="text-lg font-semibold">{t("recordHistory")}</h2>
        {log.totalCount > log.entries.length && (
          <Link href={auditHref(path, {}, { entity: entityId })} className="text-sm text-primary hover:underline">
            {t("allChanges", { count: log.totalCount })}
          </Link>
        )}
      </div>
      <EntryTable entries={log.entries} linkOf={linkOf} />
    </section>
  );
}
