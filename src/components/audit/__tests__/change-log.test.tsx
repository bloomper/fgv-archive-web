import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { ChangeLog, RecordHistory } from "@/components/audit/change-log";
import { ChangeLogView } from "@/components/audit/change-log.client";
import type { AuditRow } from "@/utils/audit";

const getAuditLog = vi.hoisted(() => vi.fn());
const getAuditActors = vi.hoisted(() => vi.fn());
const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@/lib/admin/admin.server", () => ({ getAuditLog, getAuditActors }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/manage/audit" }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

/**
 * Renders a server component tree: awaits every async component, as React does on the server.
 */
async function resolve(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(node.map(resolve));
  }
  if (!React.isValidElement(node)) {
    return node;
  }

  const element = node as React.ReactElement<{ children?: React.ReactNode }>;

  // Only the async (server) components; the others, which may use hooks, are left to React
  if (typeof element.type === "function" && element.type.constructor.name === "AsyncFunction") {
    return resolve(await (element.type as (props: unknown) => Promise<React.ReactNode>)(element.props));
  }
  if (element.props.children === undefined) {
    return element;
  }
  const children = element.props.children;

  // Static children go back as separate arguments, as JSX passes them, so React wants no keys for them
  return Array.isArray(children)
    ? React.cloneElement(element, undefined, ...(await Promise.all(children.map(resolve))))
    : React.cloneElement(element, undefined, await resolve(children));
}

const ENTRY = {
  id: "e1",
  at: "2026-11-01T10:00:00Z",
  actorName: "Anna",
  action: "UPDATE",
  entityType: "VIDEO",
  entityId: "a1",
  summary: "Ändrade filmen Nobel",
};
const linkOf = (type: string, id: string) => (type === "VIDEO" ? `/manage/videos/${id}` : null);
const loadMore = vi.fn();
const props = { path: "/manage/audit", entityTypes: ["VIDEO", "COLLECTION"], linkOf, loadMore };

async function renderLog(search: Record<string, string>, isAdmin = false) {
  render(<>{await resolve(await ChangeLog({ ...props, search, isAdmin }))}</>);
}

const row = (id: string, overrides: Partial<AuditRow> = {}): AuditRow => ({
  id,
  at: "2026-11-01T10:00:00Z",
  actorName: "Anna",
  action: "UPDATE",
  entityType: "VIDEO",
  summary: `Ändring ${id}`,
  link: null,
  historyHref: null,
  ...overrides,
});

describe("ChangeLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuditActors.mockResolvedValue([
      { id: "u1", name: "Anna" },
      { id: "u2", name: null },
    ]);
  });

  it("lists the changes with links to their records and their histories, without filters", async () => {
    getAuditLog.mockResolvedValue({
      totalCount: 2,
      entries: [ENTRY, { ...ENTRY, id: "e2", action: "DELETE", summary: "Tog bort filmen Fritiof" }],
    });

    await renderLog({});

    expect(getAuditLog).toHaveBeenCalledWith(0, 15, {
      entityType: null,
      action: null,
      actorId: null,
      from: null,
      to: null,
      q: null,
      entityId: null,
    });
    expect(getAuditActors).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Audit.who/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ändrade filmen Nobel" })).toHaveAttribute("href", "/manage/videos/a1");
    expect(screen.queryByRole("link", { name: "Tog bort filmen Fritiof" })).not.toBeInTheDocument();
    expect(screen.getByText('Audit.count:{"count":2}')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Audit.reset" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Common.loadMore" })).not.toBeInTheDocument();

    // The opened row has the record and its history
    await userEvent.click(screen.getAllByRole("button", { name: "Audit.details" })[0]);
    expect(screen.getByRole("link", { name: "openRecord" })).toHaveAttribute("href", "/manage/videos/a1");
    expect(screen.getByRole("link", { name: /historyOf/ })).toHaveAttribute("href", "/manage/audit?entity=a1");
  });

  it("filters by everything in the address, and lets an admin pick a person", async () => {
    getAuditLog.mockResolvedValue({ totalCount: 120, entries: [ENTRY] });

    await renderLog(
      {
        type: "VIDEO",
        action: "UPDATE",
        actor: "u1",
        from: "2026-11-01",
        to: "2026-11-02",
        q: "  nobel ",
        entity: "a1",
      },
      true
    );

    expect(getAuditLog).toHaveBeenCalledWith(
      0,
      15,
      expect.objectContaining({
        entityType: "VIDEO",
        action: "UPDATE",
        actorId: "u1",
        q: "nobel",
        entityId: "a1",
        from: "2026-10-31T23:00:00.000Z",
        to: "2026-11-02T23:00:00.000Z",
      })
    );
    expect(screen.getByRole("button", { name: /Audit.who/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audit.reset" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Audit.allRecords" })).not.toHaveAttribute(
      "href",
      expect.stringContaining("entity=")
    );
    expect(screen.getByRole("button", { name: "Common.loadMore" })).toBeInTheDocument();
  });

  it("ignores the person for editors and says when nothing matches", async () => {
    getAuditLog.mockResolvedValue(null);

    await renderLog({ actor: "u1" });
    expect(getAuditLog).toHaveBeenCalledWith(0, 15, expect.objectContaining({ actorId: null }));
    expect(screen.getByText("Audit.noneFiltered")).toBeInTheDocument();
    expect(screen.queryByText(/^Audit.count:/)).not.toBeInTheDocument();
  });
});

describe("ChangeLogView", () => {
  beforeEach(() => vi.clearAllMocks());

  const view = (search: Record<string, string>, rows: AuditRow[], totalCount: number) => (
    <ChangeLogView
      search={search}
      isAdmin={false}
      entityTypes={["VIDEO"]}
      actors={[]}
      initial={{ rows, totalCount }}
      pageSize={2}
      loadMore={loadMore}
    />
  );

  it("loads more with the same filter and appends what comes", async () => {
    loadMore.mockResolvedValue({ rows: [row("e2"), row("e3")], totalCount: 3 });

    render(view({ type: "VIDEO" }, [row("e1"), row("e2")], 3));
    await userEvent.click(screen.getByRole("button", { name: "Common.loadMore" }));

    expect(loadMore).toHaveBeenCalledWith({ type: "VIDEO" }, 1, 2);
    await waitFor(() => expect(screen.getByText("Ändring e3")).toBeInTheDocument());
    expect(screen.getAllByText("Ändring e2")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Common.loadMore" })).not.toBeInTheDocument();
  });

  it("puts the search in the address and clears the filter", async () => {
    render(view({ action: "TRASH" }, [], 0));
    expect(screen.getByText("Audit.noneFiltered")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("searchbox", { name: "Audit.search" }), "nobel");
    await waitFor(() =>
      expect(router.replace).toHaveBeenLastCalledWith("/manage/audit?action=TRASH&q=nobel", { scroll: false })
    );

    await userEvent.click(screen.getByRole("button", { name: "Audit.reset" }));
    expect(router.replace).toHaveBeenLastCalledWith("/manage/audit", { scroll: false });
  });

  it("shows the event under the person on a narrow screen", () => {
    render(view({}, [row("e1", { action: "TRASH" })], 1));

    const cells = within(screen.getByText("Ändring e1").closest("tr")!).getAllByRole("cell");

    expect(cells[2]).toHaveTextContent("TRASH");
  });
});

describe("RecordHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a record's latest changes and links to all of them when there are more", async () => {
    getAuditLog.mockResolvedValue({ totalCount: 12, entries: [ENTRY] });

    render(<>{await resolve(await RecordHistory({ entityId: "a1", path: "/manage/audit", linkOf }))}</>);

    expect(getAuditLog).toHaveBeenCalledWith(0, 10, { entityId: "a1" });
    expect(screen.getByRole("heading", { name: "recordHistory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: 'allChanges:{"count":12}' })).toHaveAttribute(
      "href",
      "/manage/audit?entity=a1"
    );
    expect(screen.getByRole("link", { name: "Ändrade filmen Nobel" })).toBeInTheDocument();
  });

  it("shows nothing without changes or when the log cannot be read", async () => {
    getAuditLog.mockResolvedValueOnce({ totalCount: 0, entries: [] }).mockRejectedValueOnce(new Error("down"));

    expect(await RecordHistory({ entityId: "a1", path: "/manage/audit", linkOf })).toBeNull();
    expect(await RecordHistory({ entityId: "a1", path: "/manage/audit", linkOf })).toBeNull();
  });
});
