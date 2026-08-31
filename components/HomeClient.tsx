"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";
import { EmbedCode } from "@/components/EmbedCode";
import { isAllowedPdfUrl } from "@/lib/pdf-url";

const Flipbook = dynamic(
  () => import("@/components/Flipbook").then((mod) => mod.Flipbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center bg-[#2a211c] text-sm text-[#f3eadb]">
        Preparing viewer…
      </div>
    ),
  },
);

const EXAMPLE_PDF =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

export function HomeClient() {
  const [input, setInput] = useState("");
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function applyUrl(raw: string) {
    const url = raw.trim();
    if (!url) {
      setFormError("Paste a public PDF link first.");
      return;
    }
    if (!isAllowedPdfUrl(url)) {
      setFormError("Use a full http:// or https:// URL.");
      return;
    }
    setFormError(null);
    setActiveUrl(url);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    applyUrl(input);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[#6b2d5b]">
          Flipper
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-[1.1] text-[#1a1410] sm:text-5xl">
          Turn any public PDF into a flipbook embed.
        </h1>
        <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-[#5c4d42]">
          You keep the file wherever it already lives. Paste the URL, preview the
          book, then copy two lines of HTML onto your site.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="pdf-url" className="font-sans text-sm font-medium text-[#1a1410]">
          Public PDF URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="pdf-url"
            type="url"
            inputMode="url"
            placeholder="https://example.com/my-brochure.pdf"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="h-12 flex-1 rounded-xl border border-[#d9cbb8] bg-[#fffaf3] px-4 font-sans text-[15px] text-[#1a1410] outline-none ring-[#6b2d5b] placeholder:text-[#9a8776] focus:border-[#6b2d5b] focus:ring-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-12 rounded-xl bg-[#6b2d5b] px-5 font-sans text-sm font-semibold text-[#fffaf3] transition hover:bg-[#4a1d3e]"
            >
              Generate
            </button>
            <button
              type="button"
              onClick={() => {
                setInput(EXAMPLE_PDF);
                applyUrl(EXAMPLE_PDF);
              }}
              className="h-12 rounded-xl border border-[#d9cbb8] bg-transparent px-4 font-sans text-sm font-medium text-[#1a1410] transition hover:border-[#6b2d5b]"
            >
              Try example
            </button>
          </div>
        </div>
        {formError && (
          <p className="font-sans text-sm text-[#9b2c2c]">{formError}</p>
        )}
      </form>

      {activeUrl && (
        <>
          <section className="overflow-hidden rounded-2xl border border-[#1a1410]/10 shadow-[0_20px_50px_-28px_rgba(26,20,16,0.55)]">
            <Flipbook pdfUrl={activeUrl} className="h-[640px]" />
          </section>

          <EmbedCode origin={origin || "https://your-domain"} pdfUrl={activeUrl} />

          <p className="font-sans text-sm text-[#6b5c50]">
            The script is hosted here; your PDF stays on its original URL. Add the
            head script once per page. You can place as many{" "}
            <code className="rounded bg-[#efe4d4] px-1 py-0.5 text-xs">
              .fl-flipbook
            </code>{" "}
            placeholders as you like.
          </p>
        </>
      )}
    </div>
  );
}
