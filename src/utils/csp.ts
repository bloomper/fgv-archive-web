/**
 * The pages' Content Security Policy, set per request in {@code proxy.ts}. Everything comes from the web's own origin:
 * files and previews through its route handlers, and pdf.js's worker, fonts and decoders from public/pdfjs.
 *
 * Scripts keep 'unsafe-inline': Next.js puts inline scripts in every page, and a nonce would need every page rendered
 * per request, which Cache Components' partial prerendering (static shells) rules out. 'wasm-unsafe-eval', for
 * pdf.js's image decoders, is only on the reader's pages; elsewhere, and after a client-side navigation to the reader,
 * pdf.js falls back to its JavaScript decoders.
 */
export function contentSecurityPolicy(development: boolean, reader = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${reader ? " 'wasm-unsafe-eval'" : ""}${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** The reader's pages, in the app and under a share link. */
const READER = /^\/(?:files\/[^/]+|share\/[^/]+\/files\/[^/]+)\/?$/;

export function isReaderPath(pathname: string): boolean {
  return READER.test(pathname);
}
