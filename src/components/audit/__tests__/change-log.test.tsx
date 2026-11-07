import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import * as React from "react";
import { ChangeLog, RecordHistory } from "@/components/audit/change-log";

const getAuditLog = vi.hoisted(() => vi.fn());
const getAuditActors = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/admin.server", () => ({ getAuditLog, getAuditActors }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => Object.assign(
    (key: string, values?: Record<string, unknown>) => (values ? `${key}:${JSON.stringify(values)}` : key),
    { has: (key: string) => key !== "action.ODD" && key !== "type.ODD" },
  ),
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
  entityType: "ALBUM",
  entityId: "a1",
  summary: "Ändrade albumet Nobel",
};
const linkOf = (type: string, id: string) => (type === "ALBUM" ? `/manage/albums/${id}` : null);
const props = { path: "/manage/audit", entityTypes: ["ALBUM", "TRACK"], linkOf };

async function renderLog(search: Record<string, string>, isAdmin = false) {
  render(<>{await resolve(await ChangeLog({ ...props, search, isAdmin }))}</>);
}

describe("ChangeLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuditActors.mockResolvedValue([{ id: "u1", name: "Anna" }, { id: "u2", name: null }]);
  });

  it("lists the changes with links to their records and their histories, without filters", async () => {
    getAuditLog.mockResolvedValue({
      totalCount: 3, entries: [
        ENTRY,
        { ...ENTRY, id: "e2", action: "DELETE", summary: "Tog bort albumet Fritiof" },
        {
          id: "e3",
          at: "2026-11-01T11:00:00Z",
          actorName: null,
          action: "ODD",
          entityType: "ODD",
          entityId: null,
          summary: "Något annat",
        },
      ],
    });

    await renderLog({});

    expect(getAuditLog).toHaveBeenCalledWith(0, 50, {
      entityType: null,
      action: null,
      actorId: null,
      from: null,
      to: null,
      q: null,
      entityId: null,
    });
    expect(getAuditActors).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("who")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ändrade albumet Nobel" })).toHaveAttribute("href", "/manage/albums/a1");
    expect(screen.queryByRole("link", { name: "Tog bort albumet Fritiof" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /historyOf/ })[0]).toHaveAttribute("href", "/manage/audit?entity=a1");

    const odd = screen.getByText("Något annat").closest("tr")!;

    expect(within(odd).getByText("ODD", { selector: "[data-slot=badge]:first-child" })).toBeInTheDocument();
    expect(within(odd).getByText("–")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "reset" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "pages" })).not.toBeInTheDocument();
  });

  it("filters by everything in the address, and lets an admin pick a person", async () => {
    getAuditLog.mockResolvedValue({ totalCount: 120, entries: [ENTRY] });

    await renderLog({
      page: "1",
      type: "ALBUM",
      action: "UPDATE",
      actor: "u1",
      from: "2026-11-01",
      to: "2026-11-02",
      q: "  nobel ",
      entity: "a1",
    }, true);

    expect(getAuditLog).toHaveBeenCalledWith(1, 50, expect.objectContaining({
      entityType: "ALBUM", action: "UPDATE", actorId: "u1", q: "nobel", entityId: "a1",
      from: "2026-10-31T23:00:00.000Z", to: "2026-11-02T23:00:00.000Z",
    }));
    expect(screen.getByLabelText("who")).toHaveValue("u1");
    expect(screen.getByRole("option", { name: "u2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "reset" })).toHaveAttribute("href", "/manage/audit");
    expect(screen.getByRole("link", { name: "allRecords" })).not.toHaveAttribute("href", expect.stringContaining("entity="));
    expect(screen.queryByRole("link", { name: /historyOf/ })).not.toBeInTheDocument();

    const pages = screen.getByRole("navigation", { name: "pages" });

    expect(within(pages).getByRole("link", { name: "newer" })).toHaveAttribute("href", expect.not.stringContaining("page="));
    expect(within(pages).getByRole("link", { name: "older" })).toHaveAttribute("href", expect.stringContaining("page=2"));
    expect(pages).toHaveTextContent("pageOf:{\"page\":2,\"pages\":3}");
  });

  it("ignores the person for editors and a bad page, and says when nothing matches", async () => {
    getAuditLog.mockResolvedValue({ totalCount: 0, entries: [] });

    await renderLog({ page: "-3", actor: "u1" });
    expect(getAuditLog).toHaveBeenCalledWith(0, 50, expect.objectContaining({ actorId: null }));
    expect(screen.getByText("none")).toBeInTheDocument();
    expect(screen.queryByText(/^count:/)).not.toBeInTheDocument();
  });

  it("says that nothing matches a filter, also when the log could not be read", async () => {
    getAuditLog.mockResolvedValue(null);

    await renderLog({ action: "TRASH" });
    expect(screen.getByText("noneFiltered")).toBeInTheDocument();
    expect(screen.queryByText(/^count:/)).not.toBeInTheDocument();
  });
});

describe("RecordHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a record's latest changes and links to all of them when there are more", async () => {
    getAuditLog.mockResolvedValue({ totalCount: 12, entries: [ENTRY] });

    render(<>{await resolve(await RecordHistory({ entityId: "a1", path: "/manage/audit", linkOf }))}</>);

    expect(getAuditLog).toHaveBeenCalledWith(0, 10, { entityId: "a1" });
    expect(screen.getByRole("heading", { name: "recordHistory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "allChanges:{\"count\":12}" })).toHaveAttribute("href", "/manage/audit?entity=a1");
  });

  it("shows nothing without changes or when the log cannot be read", async () => {
    getAuditLog.mockResolvedValueOnce({ totalCount: 0, entries: [] }).mockRejectedValueOnce(new Error("down"));

    expect(await RecordHistory({ entityId: "a1", path: "/manage/audit", linkOf })).toBeNull();
    expect(await RecordHistory({ entityId: "a1", path: "/manage/audit", linkOf })).toBeNull();
  });
});
