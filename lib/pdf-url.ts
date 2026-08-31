export function isAllowedPdfUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function proxyPdfUrl(pdfUrl: string): string {
  return `/api/pdf?url=${encodeURIComponent(pdfUrl)}`;
}
