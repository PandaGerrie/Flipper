"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

const Flipbook = dynamic(
  () => import("@/components/Flipbook").then((mod) => mod.Flipbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[#f3eadb]">
        Loading catalog…
      </div>
    ),
  },
);

type FullscreenCatalogProps = {
  pdfUrl: string;
  onClose: () => void;
};

export function FullscreenCatalog({ pdfUrl, onClose }: FullscreenCatalogProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#1c1410]">
      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-white/10 px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/20 px-4 py-2 font-sans text-sm font-medium text-[#f3eadb] transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <Flipbook pdfUrl={pdfUrl} className="h-full min-h-0" />
      </div>
    </div>
  );
}
