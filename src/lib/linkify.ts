export type TextPart = { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

/**
 * Splits plain text into text and http(s) links, so steering group text can show clickable links without ever being
 * read as Markdown or HTML. Anything else, `javascript:` included, stays text.
 */
export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const trailing = TRAILING_PUNCTUATION.exec(match[0])?.[0] ?? "";
    const url = match[0].slice(0, match[0].length - trailing.length);
    const start = match.index;

    if (start > last) {
      parts.push({ kind: "text", text: text.slice(last, start) });
    }
    parts.push({ kind: "link", text: url, href: url });
    last = start + url.length;
  }
  if (last < text.length) {
    parts.push({ kind: "text", text: text.slice(last) });
  }
  return parts;
}
