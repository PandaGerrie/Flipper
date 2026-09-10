/**
 * Public PDFs useful for local demos and documentation.
 * These are not hosted by Flipper — paste the URL into the form or embed snippets.
 */
export const EXAMPLE_PDFS = {
  /** Short PDF.js sample (good for quick smoke tests). */
  tracemonkey:
    "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  /**
   * Attention Is All You Need (Vaswani et al.) — good for interactive links:
   * citation jumps, figure/table cross-refs, and external URLs in References.
   * https://arxiv.org/pdf/1706.03762
   */
  transformer: "https://arxiv.org/pdf/1706.03762",
} as const;

export const DEFAULT_EXAMPLE_PDF = EXAMPLE_PDFS.transformer;
