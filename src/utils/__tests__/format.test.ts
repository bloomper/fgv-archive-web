import { describe, expect, it } from "vitest";
import { formatDate, formatInstant, kindName } from "@/utils/format";

describe("format", () => {
  it("formats instants as yyyy-mm-dd hh:mm in Swedish time", () => {
    expect(formatInstant("2028-02-10T12:00:00Z")).toBe("2028-02-10 13:00");
    expect(formatInstant("2028-07-01T22:30:00Z")).toBe("2028-07-02 00:30");
    expect(formatInstant(undefined)).toBeNull();
    expect(formatInstant("garbage")).toBe("garbage");
  });

  it("formats dates as yyyy-mm-dd in Swedish time", () => {
    expect(formatDate("2028-07-01T22:30:00Z")).toBe("2028-07-02");
    expect(formatDate(null)).toBeNull();
  });

  it("names kinds in English only for English", () => {
    const kind = { nameSv: "Föreställning", nameEn: "Show" };

    expect(kindName(kind, "en")).toBe("Show");
    expect(kindName(kind, "sv")).toBe("Föreställning");
    expect(kindName(kind, "de")).toBe("Föreställning");
  });
});
