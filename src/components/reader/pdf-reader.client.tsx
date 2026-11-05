"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  Minimize,
  MoveHorizontal,
  PanelLeft,
  Rows3,
  Scan,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/utils";
import { openPdf, renderPage } from "./pdf.client";

type View = "scroll" | "page";
type Size = { width: number; height: number };

const STORAGE_KEY = "archive.reader";
const ZOOM_STEP = 1.25;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const GAP = 16;

function readView(): View | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === "scroll" || value === "page" ? value : null;
  } catch {
    return null;
  }
}

function storeView(view: View) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Private mode: the choice lasts as long as the page
  }
}

/**
 * Reads a PDF in the page with pdf.js: pages load as they are shown, with their text layer; page thumbnails, zoom
 * (fit to width or to the page), full screen, and a page view for a tablet on a music stand, where a tap on the left
 * or right half, the arrow keys or a page-turner pedal turn the page.
 */
export function PdfReader({ src, title, subtitle, downloadHref, backHref, backLabel, initialPage = 1 }: {
  /** The file's address in the web, which passes byte ranges on. */
  src: string;
  title: string;
  subtitle?: string;
  downloadHref?: string;
  backHref: string;
  backLabel: string;
  initialPage?: number;
}) {
  const t = useTranslations("Reader");
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [base, setBase] = useState<Size | null>(null);
  const [area, setArea] = useState<Size>({ width: 0, height: 0 });
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [view, setView] = useState<View>("scroll");
  const [zoom, setZoom] = useState(1);
  const [thumbnails, setThumbnails] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage)));
  const scrolledTo = useRef(false);
  const numPages = pdf?.numPages ?? 0;

  useEffect(() => {
    const stored = readView();

    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
      setView(stored);
    }
    setThumbnails(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | null = null;

    openPdf(src).then(async ({ task, pdf: loading }) => {
      destroy = () => void task.destroy();
      try {
        const doc = await loading;
        const first = await doc.getPage(1);
        const { width, height } = first.getViewport({ scale: 1 });

        if (!cancelled) {
          setBase({ width, height });
          setPdf(doc);
          setPage(current => Math.min(current, doc.numPages));
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }, () => setError(true));

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src]);

  useEffect(() => {
    const element = viewportRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => setArea({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    }));

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const scale = useMemo(() => {
    if (!base || area.width === 0) {
      return 1;
    }

    const byWidth = (area.width - 2 * GAP) / base.width;
    const byPage = Math.min(byWidth, (area.height - 2 * GAP) / base.height);

    return Math.max(0.1, (view === "page" ? byPage : Math.min(byWidth, 1.6)) * zoom);
  }, [base, area, view, zoom]);

  const goTo = useCallback((target: number) => {
    if (numPages === 0) {
      return;
    }

    const next = Math.min(Math.max(1, target), numPages);

    setPage(next);
    setPageInput(String(next));
    if (view === "scroll") {
      pageRefs.current.get(next)?.scrollIntoView({ block: "start" });
    }
  }, [numPages, view]);

  // Keeps the page in the address, so a reload or a shared link opens it, without a navigation
  useEffect(() => {
    if (numPages === 0) {
      return;
    }

    const url = new URL(window.location.href);

    url.searchParams.set("page", String(page));
    window.history.replaceState(window.history.state, "", url);
  }, [page, numPages]);

  // Opens the page asked for once the pages are laid out
  useEffect(() => {
    if (pdf && view === "scroll" && !scrolledTo.current && area.width > 0) {
      scrolledTo.current = true;
      if (page > 1) {
        requestAnimationFrame(() => pageRefs.current.get(page)?.scrollIntoView({ block: "start" }));
      }
    }
  }, [pdf, view, area.width, page]);

  // In the scroll view, the current page is the one under a line a third down the viewport
  useEffect(() => {
    const root = viewportRef.current;

    if (!pdf || view !== "scroll" || !root) {
      return;
    }

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = root.getBoundingClientRect().top + root.clientHeight / 3;
        let current = 1;

        pageRefs.current.forEach((element, number) => {
          if (element.getBoundingClientRect().top <= line && number > current) {
            current = number;
          }
        });
        setPage(current);
        setPageInput(String(current));
      });
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", onScroll);
    };
  }, [pdf, view]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void rootRef.current?.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  const changeView = useCallback((next: View) => {
    setView(next);
    setZoom(1);
    storeView(next);
    requestAnimationFrame(() => {
      if (next === "scroll") {
        pageRefs.current.get(page)?.scrollIntoView({ block: "start" });
      }
    });
  }, [page]);

  const zoomBy = useCallback((factor: number) => {
    setZoom(current => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor)));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (event.altKey || event.ctrlKey || event.metaKey || target?.closest("input, textarea, select, [contenteditable=true]")) {
        return;
      }

      const scrollView = view === "scroll";
      const actions: Record<string, () => void> = {
        ArrowRight: () => goTo(page + 1),
        ArrowLeft: () => goTo(page - 1),
        PageDown: () => goTo(page + 1),
        PageUp: () => goTo(page - 1),
        " ": () => goTo(event.shiftKey ? page - 1 : page + 1),
        Home: () => goTo(1),
        End: () => goTo(numPages),
        "+": () => zoomBy(ZOOM_STEP),
        "=": () => zoomBy(ZOOM_STEP),
        "-": () => zoomBy(1 / ZOOM_STEP),
        "0": () => setZoom(1),
        f: toggleFullscreen,
        t: () => setThumbnails(open => !open),
        p: () => changeView(scrollView ? "page" : "scroll"),
      };

      if (!scrollView) {
        actions.ArrowDown = () => goTo(page + 1);
        actions.ArrowUp = () => goTo(page - 1);
      }

      const action = actions[event.key];

      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, page, numPages, view, zoomBy, toggleFullscreen, changeView]);

  const pages = useMemo(() => Array.from({ length: numPages }, (_, index) => index + 1), [numPages]);

  return (
    <div ref={rootRef} className="flex h-[calc(100dvh-var(--header-height,0px))] min-h-0 flex-col bg-muted/40"
         data-testid="pdf-reader">
      <div role="toolbar" aria-label={t("toolbar")}
           className="flex flex-wrap items-center gap-1 border-b bg-background px-2 py-1.5 sm:gap-2 sm:px-3">
        {!fullscreen && (
          <Link href={backHref} aria-label={backLabel} title={backLabel} className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <ArrowLeft />
     </Link>
        )}
        <div className="mr-auto min-w-0 flex-1 basis-40">
          <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setThumbnails(open => !open)}
                aria-pressed={thumbnails} aria-label={t("thumbnails")} title={t("thumbnails")}
                className="hidden sm:inline-flex">
          <PanelLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => goTo(page - 1)} disabled={page <= 1}
                aria-label={t("previous")} title={t("previous")}>
          <ChevronLeft />
        </Button>
        <form className="flex items-center gap-1 text-sm tabular-nums" onSubmit={event => {
          event.preventDefault();
          goTo(Number(pageInput) || page);
        }}>
          <input aria-label={t("page")} value={pageInput} inputMode="numeric"
                 onChange={event => setPageInput(event.target.value.replace(/\D/g, ""))}
                 onBlur={() => setPageInput(String(page))}
                 className="h-8 w-10 rounded-md border bg-background text-center" />
          <span className="text-muted-foreground" aria-live="polite">{t("of", { count: numPages })}</span>
        </form>
        <Button variant="ghost" size="icon-sm" onClick={() => goTo(page + 1)} disabled={page >= numPages}
                aria-label={t("next")} title={t("next")}>
          <ChevronRight />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label={t("zoomOut")}
                title={t("zoomOut")}>
          <ZoomOut />
        </Button>
        <span className="hidden w-12 text-center text-xs tabular-nums text-muted-foreground sm:inline">
          {Math.round(scale * 100)} %
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(ZOOM_STEP)} aria-label={t("zoomIn")}
                title={t("zoomIn")}>
          <ZoomIn />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setZoom(1)} aria-label={view === "page" ? t("fitPage") : t("fitWidth")}
                title={view === "page" ? t("fitPage") : t("fitWidth")}>
          {view === "page" ? <Scan /> : <MoveHorizontal />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => changeView(view === "page" ? "scroll" : "page")}
                aria-pressed={view === "page"} aria-label={view === "page" ? t("scrollView") : t("pageView")}
                title={view === "page" ? t("scrollView") : t("pageView")}>
          {view === "page" ? <Rows3 /> : <BookOpen />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}
                aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
                title={fullscreen ? t("exitFullscreen") : t("fullscreen")}>
          {fullscreen ? <Minimize /> : <Maximize />}
        </Button>
        {downloadHref && (
          <a href={downloadHref} download data-umami-event="file-download" aria-label={t("download")} title={t("download")} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
      <Download />
     </a>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {thumbnails && pdf && (
          <nav aria-label={t("thumbnails")}
               className="hidden w-36 shrink-0 overflow-y-auto border-r bg-background p-2 sm:block">
            <ol className="space-y-2">
              {pages.map(number => (
                <li key={number}>
                  <button type="button" onClick={() => goTo(number)}
                          aria-current={number === page ? "page" : undefined}
                          aria-label={t("goToPage", { page: number })}
                          className={cn("block w-full rounded-md border-2 p-1 text-center text-xs",
                            number === page ? "border-primary" : "border-transparent hover:border-border")}>
                    <Thumbnail pdf={pdf} number={number} base={base} />
                    <span className="tabular-nums">{number}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div ref={viewportRef} tabIndex={-1} className="relative min-w-0 flex-1 overflow-auto outline-none"
             aria-label={title}>
          {error ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div className="space-y-3">
                <p role="alert" className="font-medium">{t("error")}</p>
                {downloadHref && (
                  <a href={downloadHref} download className={buttonVariants({ variant: "outline" })}>
          <Download /> {t("download")}
         </a>
                )}
              </div>
            </div>
          ) : !pdf || !base ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner /> {t("loading")}
            </div>
          ) : view === "scroll" ? (
            <div className="flex flex-col items-center gap-4 py-4">
              {pages.map(number => (
                <div key={number} ref={element => {
                  if (element) {
                    pageRefs.current.set(number, element);
                  } else {
                    pageRefs.current.delete(number);
                  }
                }} data-page={number}>
                  <PageView pdf={pdf} number={number} scale={scale} base={base} lazy label={t("pageLabel", { page: number })} />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative flex min-h-full items-center justify-center p-4">
              <PageView pdf={pdf} number={page} scale={scale} base={base} label={t("pageLabel", { page })} />
              {/* Tap zones for turning pages on a touch screen; the text stays selectable between them */}
              <button type="button" aria-label={t("previous")} onClick={() => goTo(page - 1)}
                      className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize focus-visible:bg-primary/5" />
              <button type="button" aria-label={t("next")} onClick={() => goTo(page + 1)}
                      className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize focus-visible:bg-primary/5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loads a page when it is about to be seen (or at once when not lazy) and draws it with its text layer.
 */
function PageView({ pdf, number, scale, base, lazy = false, label }: {
  pdf: PDFDocumentProxy;
  number: number;
  scale: number;
  base: Size;
  lazy?: boolean;
  label: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    if (!lazy || !holder.current) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "100% 0px" });

    observer.observe(holder.current);
    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    pdf.getPage(number).then(loaded => !cancelled && setPage(loaded), () => undefined);
    return () => {
      cancelled = true;
    };
  }, [pdf, number, visible]);

  useEffect(() => {
    if (!page || !canvas.current) {
      return;
    }

    setRendering(true);

    const rendered = renderPage(page, canvas.current, scale, text.current);

    rendered.done.then(() => setRendering(false), () => setRendering(false));
    return () => rendered.cancel();
  }, [page, scale]);

  const size = page ? page.getViewport({ scale }) : { width: base.width * scale, height: base.height * scale };

  return (
    <div ref={holder} role="img" aria-roledescription="page" aria-label={label}
         className="relative bg-white shadow-md"
         style={{ width: Math.floor(size.width), height: Math.floor(size.height) }}>
      <canvas ref={canvas} className="block" aria-hidden />
      <div ref={text} className="textLayer" />
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

const THUMBNAIL_WIDTH = 112;

function Thumbnail({ pdf, number, base }: { pdf: PDFDocumentProxy; number: number; base: Size | null }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const height = base ? Math.round(THUMBNAIL_WIDTH * base.height / base.width) : 150;

  useEffect(() => {
    if (!holder.current) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px 0px" });

    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let rendered: { cancel: () => void } | null = null;
    let cancelled = false;

    pdf.getPage(number).then(page => {
      if (!cancelled && canvas.current) {
        rendered = renderPage(page, canvas.current, THUMBNAIL_WIDTH / page.getViewport({ scale: 1 }).width);
      }
    }, () => undefined);
    return () => {
      cancelled = true;
      rendered?.cancel();
    };
  }, [pdf, number, visible]);

  return (
    <div ref={holder} className="mx-auto mb-1 bg-white shadow-sm" style={{ width: THUMBNAIL_WIDTH, height }}>
      <canvas ref={canvas} className="block" aria-hidden />
    </div>
  );
}
