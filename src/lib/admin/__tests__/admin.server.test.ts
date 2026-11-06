import { beforeEach, describe, expect, it, vi } from "vitest";
import * as admin from "@/lib/admin/admin.server";

const { runQuery, runMutation } = vi.hoisted(() => ({ runQuery: vi.fn(), runMutation: vi.fn() }));

vi.mock("@/lib/graphql.server", () => ({ runQuery, runMutation }));

describe("the admin client", () => {
  beforeEach(() => {
    runQuery.mockReset();
    runMutation.mockReset();
  });

  it("unwraps the query results", async () => {
    runQuery.mockResolvedValueOnce({ shareLinks: [{ id: "s1" }] });
    expect(await admin.getShareLinks(true)).toEqual([{ id: "s1" }]);
    expect(runQuery.mock.calls.at(-1)?.[1]).toEqual({ all: true });
    runQuery.mockResolvedValueOnce(undefined);
    expect(await admin.getShareLinks(false)).toEqual([]);

    runQuery.mockResolvedValueOnce({ trash: { manuscripts: [], arrangements: [], versions: [] } });
    expect(await admin.getTrash()).toEqual({ manuscripts: [], arrangements: [], versions: [] });

    runQuery.mockResolvedValueOnce({ auditLog: { totalCount: 0 } });
    expect(await admin.getAuditLog(2, 50)).toEqual({ totalCount: 0 });
    expect(runQuery.mock.calls.at(-1)?.[1]).toEqual({ page: 2, size: 50, filter: {} });

    runQuery.mockResolvedValueOnce({ storage: { fileCount: 3 } });
    expect(await admin.getStorage()).toEqual({ fileCount: 3 });
  });

  it("sends the mutations' variables", async () => {
    runMutation.mockResolvedValue({});
    await admin.instrumentMerge("a", "b");
    expect(runMutation.mock.calls.at(-1)?.[1]).toEqual({ id: "a", intoId: "b" });
    await admin.fileRolesReorder(["r2", "r1"]);
    expect(runMutation.mock.calls.at(-1)?.[1]).toEqual({ ids: ["r2", "r1"] });
    await admin.trashEmpty();
    await admin.settingsUpdate({ maxUploadMb: 5 } as never);
    expect(runMutation.mock.calls.at(-1)?.[1]).toEqual({ input: { maxUploadMb: 5 } });
    expect(runMutation).toHaveBeenCalledTimes(4);
  });

  it("reads the maintenance jobs and starts one", async () => {
    runQuery.mockResolvedValueOnce({ maintenanceJobs: [{ job: "SPEX_REFRESH", running: false }] });
    expect(await admin.getMaintenanceJobs()).toEqual([{ job: "SPEX_REFRESH", running: false }]);

    runMutation.mockResolvedValueOnce({ maintenanceJobRun: true });
    expect(await admin.maintenanceJobRun("UPLOAD_CLEANUP")).toBe(true);
    runMutation.mockResolvedValueOnce({ maintenanceJobRun: false });
    expect(await admin.maintenanceJobRun("FILE_BACKFILL")).toBe(false);
  });
});
