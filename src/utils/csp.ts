/**
 * The pages' Content Security Policy, set per request in {@code proxy.ts}. Everything comes from the web's own origin:
 * files and previews through its route handlers, and pdf.js's worker, fonts and decoders from public/pdfjs. pdf.js
 * decodes some images with WebAssembly, hence 'wasm-unsafe-eval'.
 */
export function contentSecurityPolicy(development: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ""}`,
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
