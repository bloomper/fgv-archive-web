import { describe, expect, it } from "vitest";
import { auditHref, startOfDay } from "@/utils/audit";

describe("audit helpers", () => {
  it("starts days at midnight Swedish time, summer and winter", () => {
    expect(startOfDay("2026-07-01")).toBe("2026-06-30T22:00:00.000Z");
    expect(startOfDay("2026-12-01")).toBe("2026-11-30T23:00:00.000Z");
    expect(startOfDay("2026-12-31", 1)).toBe("2026-12-31T23:00:00.000Z");
    expect(startOfDay("31/12")).toBeNull();
    expect(startOfDay(undefined)).toBeNull();
  });

  it("keeps the filter in the address and leaves empty parts out", () => {
    expect(auditHref("/manage/audit", { type: "ALBUM", q: "" }, { action: "UPDATE" })).toBe("/manage/audit?type=ALBUM&action=UPDATE");
    expect(auditHref("/manage/audit", { type: "ALBUM" }, { type: undefined })).toBe("/manage/audit");
  });
});
