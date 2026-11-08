import { describe, expect, it, vi } from "vitest";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { getPdfPage, renderPage } from "@/components/reader/pdf.client";

/** What pdf.js does once its document is destroyed: the transport is gone, and it throws at once. */
const gone = () => {
  throw new TypeError("Cannot read properties of null (reading 'sendWithPromise')");
};

describe("the reader's pdf.js helpers", () => {
  it("turns asking a destroyed document for a page into a rejection", async () => {
    const destroyed = { getPage: vi.fn(gone) } as unknown as PDFDocumentProxy;
    const page = {} as PDFPageProxy;
    const open = { getPage: vi.fn(async () => page) } as unknown as PDFDocumentProxy;

    await expect(getPdfPage(destroyed, 3)).rejects.toThrow("sendWithPromise");
    await expect(getPdfPage(open, 3)).resolves.toBe(page);
  });

  it("draws nothing for a page of a destroyed document, and says so in done", async () => {
    const page = {
      getViewport: () => ({ width: 100, height: 200 }),
      render: vi.fn(gone),
    } as unknown as PDFPageProxy;
    const rendered = renderPage(page, document.createElement("canvas"), 1);

    expect(() => rendered.cancel()).not.toThrow();
    await expect(rendered.done).rejects.toThrow("sendWithPromise");
  });
});
