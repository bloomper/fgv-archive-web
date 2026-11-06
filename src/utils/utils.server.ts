import "server-only";

function parseSupportedLocales(raw: string | undefined): Set<string> {
  const items = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return new Set(items.length > 0 ? items : ["sv", "en"]);
}

export const SUPPORTED_LOCALES = parseSupportedLocales(process.env.SUPPORTED_LOCALES);
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE && SUPPORTED_LOCALES.has(process.env.DEFAULT_LOCALE)
  ? process.env.DEFAULT_LOCALE
  : "sv";

export function normalizeLocale(input: string | undefined): string {
  return input && SUPPORTED_LOCALES.has(input) ? input : DEFAULT_LOCALE;
}
