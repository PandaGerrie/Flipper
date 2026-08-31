export type PdfHotspot = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
} & (
  | { kind: "url"; href: string }
  | { kind: "page"; pageIndex: number }
  | { kind: "named"; action: NamedPdfAction }
);

export type NamedPdfAction = "NextPage" | "PrevPage" | "FirstPage" | "LastPage";

export type FlipPage = {
  src: string;
  aspect: number;
  hotspots: PdfHotspot[];
};

const NAMED_ACTIONS = new Set<NamedPdfAction>([
  "NextPage",
  "PrevPage",
  "FirstPage",
  "LastPage",
]);

function isSafeHref(href: string): boolean {
  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

function rectToBox(
  rect: number[],
  viewport: { width: number; height: number; convertToViewportRectangle: (rect: number[]) => number[] },
) {
  const converted = viewport.convertToViewportRectangle(rect);
  const leftPx = Math.min(converted[0], converted[2]);
  const topPx = Math.min(converted[1], converted[3]);
  const widthPx = Math.abs(converted[2] - converted[0]);
  const heightPx = Math.abs(converted[3] - converted[1]);

  return {
    left: (leftPx / viewport.width) * 100,
    top: (topPx / viewport.height) * 100,
    width: (widthPx / viewport.width) * 100,
    height: (heightPx / viewport.height) * 100,
  };
}

async function destToPageIndex(
  pdf: {
    getDestination: (id: string) => Promise<unknown[] | null>;
    getPageIndex: (ref: { num: number; gen: number }) => Promise<number>;
  },
  dest: unknown,
): Promise<number | null> {
  try {
    const explicit = typeof dest === "string" ? await pdf.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit[0] == null) return null;

    const ref = explicit[0] as { num?: number; gen?: number } | number;
    if (typeof ref === "number") return ref;
    if (typeof ref === "object" && typeof ref.num === "number") {
      return await pdf.getPageIndex({ num: ref.num, gen: ref.gen ?? 0 });
    }
    return null;
  } catch {
    return null;
  }
}

type PdfAnnotation = {
  subtype?: string;
  rect?: number[];
  url?: string;
  unsafeUrl?: string;
  dest?: unknown;
  action?: string;
};

export async function extractPageHotspots(
  page: { getAnnotations: (params?: { intent?: string }) => Promise<unknown[]> },
  viewport: { width: number; height: number; convertToViewportRectangle: (rect: number[]) => number[] },
  pdf: {
    getDestination: (id: string) => Promise<unknown[] | null>;
    getPageIndex: (ref: { num: number; gen: number }) => Promise<number>;
  },
  pageCount: number,
  pageNumber: number,
): Promise<PdfHotspot[]> {
  const annotations = (await page.getAnnotations({ intent: "display" })) as PdfAnnotation[];
  const hotspots: PdfHotspot[] = [];

  for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i];
    if (annotation.subtype !== "Link" || !annotation.rect) continue;

    const box = rectToBox(annotation.rect, viewport);
    if (box.width < 0.15 || box.height < 0.15) continue;

    const id = `${pageNumber}-${i}`;

    if (annotation.url && isSafeHref(annotation.url)) {
      hotspots.push({
        id,
        kind: "url",
        href: annotation.url,
        label: annotation.url,
        ...box,
      });
      continue;
    }

    if (annotation.unsafeUrl && isSafeHref(annotation.unsafeUrl)) {
      hotspots.push({
        id,
        kind: "url",
        href: annotation.unsafeUrl,
        label: annotation.unsafeUrl,
        ...box,
      });
      continue;
    }

    if (annotation.dest) {
      const pageIndex = await destToPageIndex(pdf, annotation.dest);
      if (pageIndex != null && pageIndex >= 0 && pageIndex < pageCount) {
        hotspots.push({
          id,
          kind: "page",
          pageIndex,
          label: `Go to page ${pageIndex + 1}`,
          ...box,
        });
      }
      continue;
    }

    if (annotation.action && NAMED_ACTIONS.has(annotation.action as NamedPdfAction)) {
      hotspots.push({
        id,
        kind: "named",
        action: annotation.action as NamedPdfAction,
        label: annotation.action.replace("Page", " page"),
        ...box,
      });
    }
  }

  return hotspots;
}
