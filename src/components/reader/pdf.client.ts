"use client";

import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");

let loading: Promise<PdfJs> | null = null;

/**
 * pdf.js, loaded on first use in the browser only, with its worker and assets from the web's own origin (copied to
 * public/pdfjs by scripts/copy-pdfjs.mjs).
 */
export function loadPdfJs(): Promise<PdfJs> {
  loading ??= import("pdfjs-dist").then(pdfjs => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
    return pdfjs;
  });
  return loading;
}

/**
 * Opens a PDF by its address, loading only the byte ranges of the pages shown: the route handlers pass Range on to the
 * server, so a long score starts at once.
 */
export async function openPdf(url: string): Promise<{ task: PDFDocumentLoadingTask; pdf: Promise<PDFDocumentProxy> }> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({
    url,
    withCredentials: true,
    rangeChunkSize: 256 * 1024,
    disableAutoFetch: true,
    disableStream: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    wasmUrl: "/pdfjs/wasm/",
    iccUrl: "/pdfjs/iccs/",
  });

  return { task, pdf: task.promise };
}

/**
 * A page of the document, or a rejection when the document is gone: pdf.js throws at once then, rather than rejecting,
 * which a `.then(…, onRejected)` would not catch.
 */
export function getPdfPage(pdf: PDFDocumentProxy, number: number): Promise<PDFPageProxy> {
  try {
    return pdf.getPage(number);
  } catch (error) {
    return Promise.reject(error);
  }
}

export type RenderedPage = { cancel: () => void; done: Promise<void> };

/**
 * Draws a page on a canvas at a CSS scale, sharp on high-density screens, and lays its text over it when a text layer
 * is given (selectable, searchable, read by screen readers).
 */
export function renderPage(page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number,
                           textLayer?: HTMLDivElement | null): RenderedPage {
  const viewport = page.getViewport({ scale });
  const ratio = Math.min(window.devicePixelRatio || 1, 3);
  let cancelled = false;
  let textTask: { cancel: () => void } | null = null;

  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  let task: ReturnType<PDFPageProxy["render"]>;

  try {
    task = page.render({
      canvas,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
    });
  } catch (error) {
    // The document is gone (the reader was hidden or closed); there is nothing to draw
    return { cancel: () => undefined, done: Promise.reject(error) };
  }

  const done = task.promise.then(async () => {
    if (cancelled || !textLayer) {
      return;
    }

    const pdfjs = await loadPdfJs();

    textLayer.replaceChildren();
    textLayer.style.setProperty("--total-scale-factor", String(scale));
    textLayer.style.setProperty("--scale-round-x", "1px");
    textLayer.style.setProperty("--scale-round-y", "1px");

    const layer = new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: textLayer, viewport });

    textTask = layer;
    await layer.render();
  }).catch(error => {
    if ((error as Error)?.name !== "RenderingCancelledException" && !cancelled) {
      throw error;
    }
  });

  return {
    cancel: () => {
      cancelled = true;
      task.cancel();
      textTask?.cancel();
    },
    done,
  };
}
