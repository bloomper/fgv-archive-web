"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarRange, ChevronDown, ChevronRight, History, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataFilter } from "@/components/data-filter";
import { DataEmpty } from "@/components/data-empty";
import { useServerState } from "@/hooks/use-server-state.client";
import { AUDIT_ACTIONS, auditHref, type AuditPage, type AuditRow, type AuditSearch } from "@/utils/audit";
import { formatInstant } from "@/utils/format";

const ALL = "ALL";
const COLUMN_COUNT = 5;
const SEARCH_DELAY = 400;

type Variant = "default" | "secondary" | "destructive" | "outline";

function actionVariant(action: string): Variant {
  return action === "DELETE" || action === "TRASH" || action === "REVOKE"
    ? "destructive"
    : action === "CREATE" || action === "PUBLISH" || action === "SHARE"
      ? "default"
      : action === "UPDATE"
        ? "secondary"
        : "outline";
}

/** The label of a key under `Audit.<group>`, or the key itself when the application has none for it. */
function useLabel() {
  const t = useTranslations("Audit");

  return (group: "action" | "type", key: string) => (t.has(`${group}.${key}`) ? t(`${group}.${key}`) : key);
}

/**
 * The change log's toolbar: a search in the summaries, the kind of record, the event, the person (admins) and a period,
 * as in Spexregister. The filter travels in the address, so a filtered log can be linked to.
 */
function ChangeLogFilters({
  search,
  isAdmin,
  entityTypes,
  actors,
  onChange,
}: {
  search: AuditSearch;
  isAdmin: boolean;
  entityTypes: readonly string[];
  actors: { id: string; name?: string | null }[];
  onChange: (changes: Partial<AuditSearch>) => void;
}) {
  const t = useTranslations();
  const label = useLabel();
  const [q, setQ] = useServerState(search.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const typeItems = [
    { value: ALL, label: t("Audit.allTypes") },
    ...entityTypes.map(value => ({ value, label: label("type", value) })),
  ];
  const actionItems = [
    { value: ALL, label: t("Audit.allActions") },
    ...AUDIT_ACTIONS.map(value => ({ value, label: label("action", value) })),
  ];
  const hasPeriod = Boolean(search.from || search.to);
  const filtered = Boolean(search.q || search.type || search.action || search.actor || hasPeriod);

  const searchFor = (value: string) => {
    setQ(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange({ q: value.trim() || undefined }), SEARCH_DELAY);
  };

  return (
    <div
      role="search"
      aria-label={t("Audit.filters")}
      className="flex flex-wrap items-center gap-2"
    >
      <div className="relative w-full sm:w-56">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          maxLength={100}
          onChange={e => searchFor(e.target.value)}
          placeholder={t("Audit.search")}
          aria-label={t("Audit.search")}
          className="h-8 pl-8"
        />
      </div>

      <Select
        value={search.type || ALL}
        onValueChange={next => next !== null && onChange({ type: next === ALL ? undefined : next })}
        items={typeItems}
      >
        <SelectTrigger
          size="sm"
          className="w-full sm:w-44"
          aria-label={t("Audit.typeLabel")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {typeItems.map(item => (
            <SelectItem
              key={item.value}
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={search.action || ALL}
        onValueChange={next => next !== null && onChange({ action: next === ALL ? undefined : next })}
        items={actionItems}
      >
        <SelectTrigger
          size="sm"
          className="w-full sm:w-44"
          aria-label={t("Audit.actionLabel")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {actionItems.map(item => (
            <SelectItem
              key={item.value}
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isAdmin && (
        <DataFilter
          title={t("Audit.who")}
          options={actors.map(actor => ({ value: actor.id, label: actor.name ?? actor.id }))}
          selectedValues={new Set(search.actor ? [search.actor] : [])}
          // The server takes one person: the one picked last
          onSelect={values => onChange({ actor: [...values].find(value => value !== search.actor) })}
          onClear={() => onChange({ actor: undefined })}
        />
      )}

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed"
            />
          }
        >
          <CalendarRange className="mr-2 h-4 w-4" />
          {t("Audit.period")}
          {hasPeriod && (
            <>
              <Separator
                orientation="vertical"
                className="mx-2 h-4"
              />
              <span className="text-xs">
                {search.from || "…"} – {search.to || "…"}
              </span>
            </>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-3"
          align="start"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="audit-from"
                className="text-xs text-muted-foreground"
              >
                {t("Audit.from")}
              </Label>
              <Input
                id="audit-from"
                type="date"
                className="h-8 w-44"
                value={search.from ?? ""}
                max={search.to || undefined}
                onChange={e => onChange({ from: e.target.value || undefined })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="audit-to"
                className="text-xs text-muted-foreground"
              >
                {t("Audit.to")}
              </Label>
              <Input
                id="audit-to"
                type="date"
                className="h-8 w-44"
                value={search.to ?? ""}
                min={search.from || undefined}
                onChange={e => onChange({ to: e.target.value || undefined })}
              />
            </div>
            {hasPeriod && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => onChange({ from: undefined, to: undefined })}
              >
                {t("Common.reset")}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {filtered && (
        <Button
          variant="ghost"
          onClick={() => {
            clearTimeout(timer.current);
            setQ("");
            onChange({ q: undefined, type: undefined, action: undefined, actor: undefined, from: undefined, to: undefined });
          }}
          className="h-8 px-2 lg:px-3"
        >
          <X className="mr-2 h-4 w-4" />
          {t("Audit.reset")}
        </Button>
      )}
    </div>
  );
}

/**
 * What one change was, for its expanded row: the whole summary, the event and the kind of record, and where to go next.
 * On a phone this is where the columns that do not fit are seen.
 */
function EntryDetail({ row }: { row: AuditRow }) {
  const t = useTranslations("Audit");
  const label = useLabel();

  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="wrap-break-word">{row.summary}</p>
      <div className="flex flex-wrap gap-1">
        <Badge variant={actionVariant(row.action)}>{label("action", row.action)}</Badge>
        <Badge variant="outline">{label("type", row.entityType)}</Badge>
      </div>
      {(row.link || row.historyHref) && (
        <div className="flex flex-wrap gap-4 text-xs">
          {row.link && (
            <Link
              href={row.link}
              className="text-primary hover:text-primary/80"
            >
              {t("openRecord")}
            </Link>
          )}
          {row.historyHref && (
            <Link
              href={row.historyHref}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
              aria-label={t("historyOf", { summary: row.summary })}
            >
              <History className="size-3" />
              {t("history")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Changes as Spexregister's change log shows them: newest first, each row opening to what it was. Columns give way
 * on narrow screens (the event under the person, the summary in the opened row).
 */
export function AuditTable({
  rows,
  empty,
  pending = false,
}: {
  rows: AuditRow[];
  /** What to say when there are no rows. */
  empty?: { title: string; description?: string };
  pending?: boolean;
}) {
  const t = useTranslations();
  const label = useLabel();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(current => (current === id ? null : id));

  return (
    <div className={`rounded-md border transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead className="sm:w-40">{t("Audit.when")}</TableHead>
            <TableHead>{t("Audit.who")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("Audit.event")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("Audit.what")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center whitespace-normal"
                aria-live="polite"
              >
                <DataEmpty
                  title={empty?.title}
                  description={empty?.description}
                />
              </TableCell>
            </TableRow>
          )}
          {rows.map(row => {
            const isExpanded = expanded === row.id;

            return (
              <Fragment key={row.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => toggle(row.id)}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground"
                      aria-expanded={isExpanded}
                      aria-label={t("Audit.details")}
                      onClick={e => {
                        e.stopPropagation();
                        toggle(row.id);
                      }}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatInstant(row.at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="max-w-35 truncate sm:max-w-75"
                        title={row.actorName ?? undefined}
                      >
                        {row.actorName ?? "–"}
                      </span>
                      <span className="text-xs tracking-wide text-muted-foreground uppercase sm:hidden">
                        {label("action", row.action)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={actionVariant(row.action)}>{label("action", row.action)}</Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-normal md:table-cell">
                    <div className="flex flex-col gap-1">
                      <div>
                        <Badge variant="outline">{label("type", row.entityType)}</Badge>
                      </div>
                      {row.link ? (
                        <Link
                          href={row.link}
                          className="hover:text-primary"
                          onClick={e => e.stopPropagation()}
                        >
                          {row.summary}
                        </Link>
                      ) : (
                        <span>{row.summary}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={COLUMN_COUNT}
                      className="p-3 whitespace-normal"
                    >
                      <EntryDetail row={row} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * The change log page's body: the toolbar, the changes and "Load more". Filtering replaces the address, and the server
 * sends the first page for it; further pages come from `loadMore`.
 */
export function ChangeLogView({
  search,
  isAdmin,
  entityTypes,
  actors,
  initial,
  pageSize,
  loadMore,
}: {
  search: AuditSearch;
  isAdmin: boolean;
  entityTypes: readonly string[];
  actors: { id: string; name?: string | null }[];
  initial: AuditPage;
  pageSize: number;
  loadMore: (search: AuditSearch, page: number, size: number) => Promise<AuditPage>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const path = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useServerState(initial, value => `${value.totalCount}:${value.rows.map(row => row.id).join()}`);
  const filtered = Boolean(search.q || search.type || search.action || search.actor || search.from || search.to);

  const navigate = (changes: Partial<AuditSearch>) =>
    startTransition(() => router.replace(auditHref(path, search, changes), { scroll: false }));

  const more = () => {
    setIsLoading(true);
    loadMore(search, Math.floor(page.rows.length / pageSize), pageSize)
      .then(next =>
        setPage(current => {
          const seen = new Set(current.rows.map(row => row.id));

          return { rows: [...current.rows, ...next.rows.filter(row => !seen.has(row.id))], totalCount: next.totalCount };
        })
      )
      .catch(e => console.error("Failed to load more changes", e))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <ChangeLogFilters
        search={search}
        isAdmin={isAdmin}
        entityTypes={entityTypes}
        actors={actors}
        onChange={navigate}
      />

      {search.entity && (
        <p className="text-sm text-muted-foreground">
          {t("Audit.oneRecord")}{" "}
          <Link
            href={auditHref(path, search, { entity: undefined })}
            className="text-primary hover:text-primary/80"
          >
            {t("Audit.allRecords")}
          </Link>
        </p>
      )}

      <AuditTable
        rows={page.rows}
        pending={isPending}
        empty={
          filtered
            ? { title: t("Audit.noneFiltered"), description: t("Common.noFilterMatchDescription") }
            : { title: t("Audit.none"), description: t("Audit.noneText") }
        }
      />

      <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Only with changes: at zero the count ("Inga ändringar") would only repeat the empty state */}
        {page.rows.length > 0 && (
          <p
            className="text-sm font-medium"
            aria-live="polite"
          >
            {t("Audit.count", { count: page.totalCount })}
          </p>
        )}
        {page.rows.length < page.totalCount && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || isLoading}
            onClick={more}
          >
            {t("Common.loadMore")}
          </Button>
        )}
      </div>
    </div>
  );
}
