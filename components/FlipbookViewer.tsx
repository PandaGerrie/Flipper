"use client";

import dynamic from "next/dynamic";

const Flipbook = dynamic(
  () => import("@/components/Flipbook").then((mod) => mod.Flipbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[#f3eadb]">
        Loading flipbook…
      </div>
    ),
  },
);

export function FlipbookViewer({ pdfUrl }: { pdfUrl: string }) {
  return <Flipbook pdfUrl={pdfUrl} className="h-full" />;
}
