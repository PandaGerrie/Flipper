"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import HTMLFlipBook from "react-pageflip";
import {
  extractPageHotspots,
  type FlipPage,
  type NamedPdfAction,
  type PdfHotspot,
} from "@/lib/pdf-links";
import { proxyPdfUrl } from "@/lib/pdf-url";

const MAX_PAGES = 50;

type FlipBookHandle = {
  pageFlip: () => {
    flipNext: () => void;
    flipPrev: () => void;
    flip: (page: number) => void;
    turnToPage: (page: number) => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  };
};

type BookOrientation = "portrait" | "landscape";

type FlipbookProps = {
  pdfUrl: string;
  className?: string;
};

const Page = forwardRef<
  HTMLDivElement,
  {
    children?: ReactNode;
    aspect: number;
    hotspots?: PdfHotspot[];
    onInternalLink?: (hotspot: PdfHotspot) => void;
  }
>(function Page({ children, aspect, hotspots = [], onInternalLink }, ref) {
  return (
    <div
      ref={ref}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#fbf7ef] shadow-sm"
    >
      <div
        className="relative"
        style={{
          aspectRatio: aspect,
          width: aspect >= 1 ? "100%" : "auto",
          height: aspect >= 1 ? "auto" : "100%",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        {children}
        {hotspots.map((hotspot) => (
          <HotspotLink key={hotspot.id} hotspot={hotspot} onInternalLink={onInternalLink} />
        ))}
      </div>
    </div>
  );
});

export function Flipbook({ pdfUrl, className = "" }: FlipbookProps) {
  const bookRef = useRef<FlipBookHandle>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<FlipPage[]>([]);
  const [pageAspect, setPageAspect] = useState(0.72);
  const [pageWidth, setPageWidth] = useState(380);
  const [pageHeight, setPageHeight] = useState(528);
  const [current, setCurrent] = useState(1);
  const [orientation, setOrientation] = useState<BookOrientation>("portrait");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("Loading PDF…");
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setPages([]);
      setCurrent(1);
      setTruncated(false);
      setProgress("Loading PDF…");

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const task = pdfjs.getDocument({
          url: proxyPdfUrl(pdfUrl),
          disableRange: true,
          withCredentials: false,
        });

        const pdf = await task.promise;
        if (cancelled) return;

        const total = pdf.numPages;
        const count = Math.min(total, MAX_PAGES);
        setTruncated(total > MAX_PAGES);

        const rendered: FlipPage[] = [];
        let aspectTotal = 0;

        for (let i = 1; i <= count; i++) {
          if (cancelled) return;
          setProgress(`Rendering page ${i} of ${count}…`);

          const page = await pdf.getPage(i);
          const unscaled = page.getViewport({ scale: 1 });
          const pageAspect = unscaled.width / unscaled.height;
          aspectTotal += pageAspect;

          const scale = Math.min(1.6, 1400 / unscaled.width);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is not available.");

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          context.fillStyle = "#fbf7ef";
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          const hotspots = await extractPageHotspots(page, viewport, pdf, count, i);
          rendered.push({
            src: canvas.toDataURL("image/jpeg", 0.82),
            aspect: pageAspect,
            hotspots,
          });
        }

        if (cancelled) return;
        setPageAspect(aspectTotal / count);
        setPages(rendered);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not render this PDF.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const availableWidth = stage.clientWidth;
    const availableHeight = Math.max(stage.clientHeight, 280);
    const portrait = availableWidth < 720;

    const widthBudget = portrait ? availableWidth - 16 : (availableWidth - 24) / 2;
    const heightBudget = availableHeight - 8;

    let width = Math.floor(widthBudget);
    let height = Math.floor(width / pageAspect);

    if (height > heightBudget) {
      height = Math.floor(heightBudget);
      width = Math.floor(height * pageAspect);
    }

    width = Math.max(160, width);
    height = Math.max(220, height);

    setPageWidth(width);
    setPageHeight(height);
  }, [pageAspect]);

  useEffect(() => {
    measure();
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [measure, pages.length, isFullscreen]);

  useEffect(() => {
    function onFs() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const pageCount = pages.length;

  function flipNext() {
    bookRef.current?.pageFlip().flipNext();
  }

  function flipPrev() {
    bookRef.current?.pageFlip().flipPrev();
  }

  function goToPage(pageIndex: number, animated = true) {
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    const clamped = Math.max(0, Math.min(pageIndex, pageCount - 1));
    if (clamped === api.getCurrentPageIndex()) return;
    if (animated) api.flip(clamped);
    else api.turnToPage(clamped);
    setCurrent(clamped + 1);
  }

  function handleNamedAction(action: NamedPdfAction) {
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    const index = api.getCurrentPageIndex();
    if (action === "NextPage") goToPage(index + 1);
    if (action === "PrevPage") goToPage(index - 1);
    if (action === "FirstPage") goToPage(0);
    if (action === "LastPage") goToPage(pageCount - 1);
  }

  function pageLabel() {
    if (!pageCount) return "—";
    // Landscape spreads show two pages (cover stays single).
    if (orientation === "landscape" && current > 1 && current < pageCount) {
      const left = current % 2 === 0 ? current : current - 1;
      const right = Math.min(left + 1, pageCount);
      if (left >= 2 && right > left) return `${left} – ${right} / ${pageCount}`;
    }
    return `${current} / ${pageCount}`;
  }

  function onSliderInput(value: number) {
    setIsScrubbing(true);
    setCurrent(value);
    goToPage(value - 1, false);
  }

  function onSliderCommit(value: number) {
    setIsScrubbing(false);
    setCurrent(value);
    goToPage(value - 1, false);
  }

  function handleInternalLink(hotspot: PdfHotspot) {
    if (hotspot.kind === "page") goToPage(hotspot.pageIndex);
    if (hotspot.kind === "named") handleNamedAction(hotspot.action);
  }

  async function toggleFullscreen() {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await shell.requestFullscreen();
    }
  }

  return (
    <div
      ref={shellRef}
      className={`flex min-h-[420px] flex-col overflow-hidden bg-[#2a211c] ${className}`}
    >
      <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center p-3">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-[#f3eadb]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d9cbb8] border-t-transparent" />
            <p className="font-sans text-sm tracking-wide">{progress}</p>
          </div>
        )}

        {error && (
          <div className="max-w-md px-6 text-center text-[#f3eadb]">
            <p className="font-serif text-xl">Couldn’t open this PDF</p>
            <p className="mt-2 font-sans text-sm text-[#d9cbb8]">{error}</p>
          </div>
        )}

        {!loading && !error && pageCount > 0 && (
          <HTMLFlipBook
            key={`${pdfUrl}-${pageWidth}-${pageHeight}-${pageCount}`}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={160}
            maxWidth={pageWidth}
            minHeight={220}
            maxHeight={pageHeight}
            drawShadow
            flippingTime={700}
            usePortrait
            startZIndex={0}
            autoSize
            maxShadowOpacity={0.6}
            showCover
            mobileScrollSupport
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners
            disableFlipByClick
            className="flipbook-book"
            style={{ margin: "0 auto" }}
            startPage={0}
            onFlip={(event) => {
              if (!isScrubbing) setCurrent(event.data + 1);
            }}
            onChangeOrientation={(event) => {
              const next = event?.data;
              if (next === "portrait" || next === "landscape") setOrientation(next);
            }}
            ref={bookRef as never}
          >
            {pages.map((page, index) => (
              <Page
                key={`${index}-${page.src.slice(-12)}`}
                aspect={page.aspect}
                hotspots={page.hotspots}
                onInternalLink={handleInternalLink}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.src}
                  alt={`Page ${index + 1}`}
                  draggable={false}
                  className="pointer-events-none block h-full w-full"
                />
              </Page>
            ))}
          </HTMLFlipBook>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#1c1410] px-3 py-2.5 text-[#f3eadb] sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => goToPage(0)} label="First page">
            <SkipIcon direction="first" />
          </ToolbarButton>
          <ToolbarButton onClick={flipPrev} label="Previous page">
            <ArrowIcon direction="left" />
          </ToolbarButton>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            type="range"
            min={1}
            max={Math.max(pageCount, 1)}
            step={1}
            value={pageCount ? current : 1}
            disabled={!pageCount}
            aria-label="Page slider"
            style={
              {
                ["--progress" as string]: pageCount
                  ? `${((current - 1) / Math.max(pageCount - 1, 1)) * 100}%`
                  : "0%",
              } as CSSProperties
            }
            onChange={(event) => onSliderInput(Number(event.target.value))}
            onMouseUp={(event) => onSliderCommit(Number((event.target as HTMLInputElement).value))}
            onTouchEnd={(event) =>
              onSliderCommit(Number((event.target as HTMLInputElement).value))
            }
            className="fl-page-slider h-2 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-transparent accent-[#d9cbb8] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <p className="min-w-[5.75rem] shrink-0 text-right font-sans text-xs tabular-nums tracking-wide sm:min-w-[7rem]">
            {pageLabel()}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={flipNext} label="Next page">
              <ArrowIcon direction="right" />
            </ToolbarButton>
            <ToolbarButton onClick={() => goToPage(pageCount - 1)} label="Last page">
              <SkipIcon direction="last" />
            </ToolbarButton>
          </div>

          {truncated && (
            <p className="hidden font-sans text-[11px] text-[#d9cbb8] lg:block">
              First {MAX_PAGES} pages
            </p>
          )}

          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={toggleFullscreen}
              label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <FullscreenIcon exit={isFullscreen} />
            </ToolbarButton>
            <a
              href={proxyPdfUrl(pdfUrl)}
              download="document.pdf"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#f3eadb] transition hover:bg-white/10"
              aria-label="Download PDF"
              title="Download PDF"
            >
              <DownloadIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function HotspotLink({
  hotspot,
  onInternalLink,
}: {
  hotspot: PdfHotspot;
  onInternalLink?: (hotspot: PdfHotspot) => void;
}) {
  const style = {
    left: `${hotspot.left}%`,
    top: `${hotspot.top}%`,
    width: `${hotspot.width}%`,
    height: `${hotspot.height}%`,
  };

  const className =
    "absolute z-[3] cursor-pointer rounded-[2px] bg-transparent transition hover:bg-[#6b2d5b]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6b2d5b]";

  if (hotspot.kind === "url") {
    return (
      <a
        href={hotspot.href}
        target="_blank"
        rel="noopener noreferrer"
        title={hotspot.label}
        aria-label={hotspot.label}
        style={style}
        className={className}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      title={hotspot.label}
      aria-label={hotspot.label}
      style={style}
      className={className}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onInternalLink?.(hotspot);
      }}
    />
  );
}

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#f3eadb] transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkipIcon({ direction }: { direction: "first" | "last" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === "first" ? (
        <>
          <path d="M18 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M6 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  if (exit) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5H5v4M15 5h4v4M9 19H5v-4M15 19h4v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4v12m0 0l-4-4m4 4l4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
