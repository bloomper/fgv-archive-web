/**
 * Note names, keys and transpositions as the archive shows them: with ♯ and ♭, Swedish note names in Swedish (B♭ is
 * B, B is H, E♭ is Ess) and English ones in English. The server's enums are ASCII: C_SHARP is C♯, B_FLAT is B♭.
 */

export const TONICS = [
  "C", "C_SHARP", "D_FLAT", "D", "D_SHARP", "E_FLAT", "E", "F", "F_SHARP", "G_FLAT", "G", "G_SHARP", "A_FLAT", "A",
  "A_SHARP", "B_FLAT", "B",
] as const;

export type Tonic = typeof TONICS[number];

/** The pitches a part can be written in; C is concert pitch. */
export const PITCHES = ["C", "D_FLAT", "D", "E_FLAT", "E", "F", "F_SHARP", "G", "A_FLAT", "A", "B_FLAT", "B"] as const;

export type Pitch = typeof PITCHES[number];

export const MODES = ["MAJOR", "MINOR"] as const;

export type Mode = typeof MODES[number];

export type Key = { tonic: Tonic; mode: Mode };

export type Transposition = { pitch: Pitch; octave: number };

const ENGLISH: Record<Tonic, string> = {
  C: "C", C_SHARP: "C♯", D_FLAT: "D♭", D: "D", D_SHARP: "D♯", E_FLAT: "E♭", E: "E", F: "F", F_SHARP: "F♯",
  G_FLAT: "G♭", G: "G", G_SHARP: "G♯", A_FLAT: "A♭", A: "A", A_SHARP: "A♯", B_FLAT: "B♭", B: "B",
};

const SWEDISH: Record<Tonic, string> = {
  C: "C", C_SHARP: "Ciss", D_FLAT: "Dess", D: "D", D_SHARP: "Diss", E_FLAT: "Ess", E: "E", F: "F", F_SHARP: "Fiss",
  G_FLAT: "Gess", G: "G", G_SHARP: "Giss", A_FLAT: "Ass", A: "A", A_SHARP: "Aiss", B_FLAT: "B", B: "H",
};

const isSwedish = (locale: string) => locale !== "en";

export function isTonic(value: unknown): value is Tonic {
  return typeof value === "string" && (TONICS as readonly string[]).includes(value);
}

export function isPitch(value: unknown): value is Pitch {
  return typeof value === "string" && (PITCHES as readonly string[]).includes(value);
}

export function isMode(value: unknown): value is Mode {
  return value === "MAJOR" || value === "MINOR";
}

/**
 * A note name in the language: "B" and "H" in Swedish for B♭ and B, "B♭" and "B" in English.
 */
export function noteName(tonic: Tonic | Pitch, locale: string): string {
  return (isSwedish(locale) ? SWEDISH : ENGLISH)[tonic];
}

/**
 * A key: "Ess-dur" and "fiss-moll" in Swedish (minor keys in lower case), "E♭ major" and "F♯ minor" in English.
 */
export function formatKey(key: Key, locale: string): string {
  const name = noteName(key.tonic, locale);

  if (isSwedish(locale)) {
    return key.mode === "MINOR" ? `${name.toLowerCase()}-moll` : `${name}-dur`;
  }
  return `${name} ${key.mode === "MINOR" ? "minor" : "major"}`;
}

/**
 * A key with the keys it modulates to, e.g. "F-dur → G-dur".
 */
export function formatKeys(key: Key | null | undefined, modulations: readonly Key[], locale: string): string | null {
  if (!key) {
    return null;
  }
  return [key, ...modulations].map(k => formatKey(k, locale)).join(" → ");
}

/**
 * What a part is written in: the pitch, and an octave mark when it sounds an octave off, e.g. "B 8vb" (Swedish) or
 * "B♭ 8vb" for a tenor saxophone.
 */
export function formatTransposition(transposition: Transposition | null | undefined, locale: string): string | null {
  if (!transposition) {
    return null;
  }

  const name = noteName(transposition.pitch, locale);

  return transposition.octave < 0 ? `${name} 8vb` : transposition.octave > 0 ? `${name} 8va` : name;
}

const SWEDISH_NAMES: Record<string, Tonic> = {
  c: "C", ciss: "C_SHARP", dess: "D_FLAT", des: "D_FLAT", d: "D", diss: "D_SHARP", ess: "E_FLAT", es: "E_FLAT",
  e: "E", f: "F", fiss: "F_SHARP", gess: "G_FLAT", ges: "G_FLAT", g: "G", giss: "G_SHARP", ass: "A_FLAT",
  as: "A_FLAT", a: "A", aiss: "A_SHARP", b: "B_FLAT", h: "B",
};

/**
 * Reads a note name as typed: ♯ and ♭ or # and b ("Bb", "F#"), English words ("B flat") and, in Swedish, Swedish
 * names ("Ess", "Fiss", "H"; "B" is B♭). H means B in English too. Null when it is no note name.
 */
export function parseTonic(text: string, locale: string): Tonic | null {
  const value = text.trim().replace(/♯/g, "#").replace(/♭/g, "b").replace(/\s+/g, " ");

  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();

  if (isSwedish(locale) && SWEDISH_NAMES[lower]) {
    return SWEDISH_NAMES[lower];
  }
  if (lower === "h") {
    return "B";
  }

  const match = /^([a-g])\s*(#|b|sharp|flat|-sharp|-flat)?$/i.exec(value);

  if (!match) {
    return SWEDISH_NAMES[lower] && lower.length > 1 ? SWEDISH_NAMES[lower] : null;
  }

  const letter = match[1].toUpperCase();
  const accidental = (match[2] ?? "").replace("-", "").toLowerCase();
  const candidate = accidental === "#" || accidental === "sharp" ? `${letter}_SHARP`
    : accidental === "b" || accidental === "flat" ? `${letter}_FLAT` : letter;

  return isTonic(candidate) ? candidate : null;
}

/**
 * Reads a key as typed: a note name (see {@link parseTonic}) and the mode as "dur"/"moll", "major"/"minor", "maj"/"min"
 * or a trailing "m" ("F#m"). Without a mode it is major. Null when it is no key.
 */
export function parseKey(text: string, locale: string): Key | null {
  const value = text.trim().replace(/\s+/g, " ");
  const match = /^(.+?)(?:[\s-]*(dur|moll|major|minor|maj|min|m))?$/i.exec(value);

  if (!match) {
    return null;
  }

  const mode: Mode = /^(moll|minor|min|m)$/i.test(match[2] ?? "") ? "MINOR" : "MAJOR";
  const tonic = parseTonic(match[1], locale);

  if (tonic) {
    return { tonic, mode };
  }
  // "Hm"/"Bm" would otherwise lose their "m" to the tonic, and "Ass" is a name, not "As" plus "s"
  return null;
}

/**
 * The key as a filter value for the address, e.g. "B_FLAT-MINOR".
 */
export function keyParam(key: Key): string {
  return `${key.tonic}-${key.mode}`;
}

export function parseKeyParam(value: string | null | undefined): Key | null {
  const [tonic, mode] = (value ?? "").split("-");

  return isTonic(tonic) && isMode(mode) ? { tonic, mode } : null;
}

/** The instrument groups in the order admins and pickers show them. */
export const INSTRUMENT_GROUPS = ["WOODWIND", "BRASS", "RHYTHM", "STRINGS", "VOICES", "OTHER"] as const;

export type InstrumentGroup = typeof INSTRUMENT_GROUPS[number];

export type InstrumentName = { nameSv: string; nameEn: string };

/**
 * An instrument's or a file role's name in the language: English for "en", otherwise Swedish.
 */
export function localName(item: InstrumentName, locale: string): string {
  return locale === "en" ? item.nameEn : item.nameSv;
}
