import { describe, expect, it } from "vitest";
import {
  formatKey,
  formatKeys,
  formatTransposition,
  keyParam,
  noteName,
  parseKey,
  parseKeyParam,
  parseTonic,
  TONICS,
} from "@/utils/music";

describe("noteName", () => {
  it("names all 17 spellings in Swedish", () => {
    expect(TONICS.map(tonic => noteName(tonic, "sv"))).toEqual([
      "C", "Ciss", "Dess", "D", "Diss", "Ess", "E", "F", "Fiss", "Gess", "G", "Giss", "Ass", "A", "Aiss", "B", "H",
    ]);
  });

  it("names all 17 spellings in English, with ♯ and ♭", () => {
    expect(TONICS.map(tonic => noteName(tonic, "en"))).toEqual([
      "C", "C♯", "D♭", "D", "D♯", "E♭", "E", "F", "F♯", "G♭", "G", "G♯", "A♭", "A", "A♯", "B♭", "B",
    ]);
  });

  it("calls B♭ B and B H in Swedish", () => {
    expect(noteName("B_FLAT", "sv")).toBe("B");
    expect(noteName("B", "sv")).toBe("H");
    expect(noteName("E_FLAT", "sv")).toBe("Ess");
    expect(noteName("B_FLAT", "en")).toBe("B♭");
  });
});

describe("formatKey", () => {
  it("writes dur and moll in Swedish, minor keys in lower case", () => {
    expect(formatKey({ tonic: "F", mode: "MAJOR" }, "sv")).toBe("F-dur");
    expect(formatKey({ tonic: "E_FLAT", mode: "MAJOR" }, "sv")).toBe("Ess-dur");
    expect(formatKey({ tonic: "B", mode: "MINOR" }, "sv")).toBe("h-moll");
    expect(formatKey({ tonic: "F_SHARP", mode: "MINOR" }, "sv")).toBe("fiss-moll");
    expect(formatKey({ tonic: "B_FLAT", mode: "MAJOR" }, "sv")).toBe("B-dur");
  });

  it("writes major and minor in English", () => {
    expect(formatKey({ tonic: "B_FLAT", mode: "MAJOR" }, "en")).toBe("B♭ major");
    expect(formatKey({ tonic: "C_SHARP", mode: "MINOR" }, "en")).toBe("C♯ minor");
  });

  it("chains modulations in order", () => {
    expect(formatKeys({ tonic: "F", mode: "MAJOR" }, [{ tonic: "G", mode: "MAJOR" }, { tonic: "A_FLAT", mode: "MAJOR" }], "sv"))
      .toBe("F-dur → G-dur → Ass-dur");
    expect(formatKeys(null, [], "sv")).toBeNull();
  });
});

describe("formatTransposition", () => {
  it("names the pitch and marks octaves", () => {
    expect(formatTransposition({ pitch: "B_FLAT", octave: 0 }, "sv")).toBe("B");
    expect(formatTransposition({ pitch: "B_FLAT", octave: -1 }, "en")).toBe("B♭ 8vb");
    expect(formatTransposition({ pitch: "C", octave: 1 }, "sv")).toBe("C 8va");
    expect(formatTransposition({ pitch: "E_FLAT", octave: 0 }, "sv")).toBe("Ess");
    expect(formatTransposition(null, "sv")).toBeNull();
  });
});

describe("parseTonic", () => {
  it("accepts # and b as typed, and ♯ and ♭", () => {
    expect(parseTonic("Bb", "en")).toBe("B_FLAT");
    expect(parseTonic("Bb", "sv")).toBe("B_FLAT");
    expect(parseTonic("c#", "en")).toBe("C_SHARP");
    expect(parseTonic("E♭", "en")).toBe("E_FLAT");
    expect(parseTonic("F♯", "sv")).toBe("F_SHARP");
    expect(parseTonic("A flat", "en")).toBe("A_FLAT");
  });

  it("reads Swedish names in Swedish, where B is B♭", () => {
    expect(parseTonic("B", "sv")).toBe("B_FLAT");
    expect(parseTonic("H", "sv")).toBe("B");
    expect(parseTonic("Ess", "sv")).toBe("E_FLAT");
    expect(parseTonic("fiss", "sv")).toBe("F_SHARP");
    expect(parseTonic("Ass", "sv")).toBe("A_FLAT");
  });

  it("reads B as B in English", () => {
    expect(parseTonic("B", "en")).toBe("B");
    expect(parseTonic("H", "en")).toBe("B");
  });

  it("refuses what is no note", () => {
    expect(parseTonic("X", "sv")).toBeNull();
    expect(parseTonic("", "en")).toBeNull();
    expect(parseTonic("Fb", "en")).toBeNull();
  });
});

describe("parseKey", () => {
  it("reads keys with and without mode", () => {
    expect(parseKey("F", "sv")).toEqual({ tonic: "F", mode: "MAJOR" });
    expect(parseKey("Ess-dur", "sv")).toEqual({ tonic: "E_FLAT", mode: "MAJOR" });
    expect(parseKey("h-moll", "sv")).toEqual({ tonic: "B", mode: "MINOR" });
    expect(parseKey("Bb major", "en")).toEqual({ tonic: "B_FLAT", mode: "MAJOR" });
    expect(parseKey("F#m", "en")).toEqual({ tonic: "F_SHARP", mode: "MINOR" });
    expect(parseKey("c minor", "en")).toEqual({ tonic: "C", mode: "MINOR" });
  });

  it("refuses nonsense", () => {
    expect(parseKey("hello", "en")).toBeNull();
  });
});

describe("keyParam", () => {
  it("round-trips through the address", () => {
    expect(keyParam({ tonic: "B_FLAT", mode: "MINOR" })).toBe("B_FLAT-MINOR");
    expect(parseKeyParam("B_FLAT-MINOR")).toEqual({ tonic: "B_FLAT", mode: "MINOR" });
    expect(parseKeyParam("H-MOLL")).toBeNull();
    expect(parseKeyParam(undefined)).toBeNull();
  });
});
