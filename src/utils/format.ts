const DATE_TIME = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  timeZone: "Europe/Stockholm",
});

/**
 * Formats an instant as yyyy-mm-dd hh:mm in Swedish time, in every language.
 */
export function formatInstant(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : null;
  }

  const parts = Object.fromEntries(DATE_TIME.formatToParts(date).map(part => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/**
 * Formats an instant as yyyy-mm-dd in Swedish time, in every language.
 */
export function formatDate(value: string | Date | null | undefined): string | null {
  return formatInstant(value)?.slice(0, 10) ?? null;
}

export type KindName = { nameSv: string; nameEn: string };

/**
 * An album kind's name in the given language: English for "en", otherwise Swedish.
 */
export function kindName(kind: KindName, locale: string): string {
  return locale === "en" ? kind.nameEn : kind.nameSv;
}
