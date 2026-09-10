"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";
import { CatalogButtonPreview } from "@/components/CatalogButtonPreview";
import type { ButtonOptionsTab } from "@/components/CatalogButtonPreview";
import { EmbedCode } from "@/components/EmbedCode";
import { FullscreenCatalog } from "@/components/FullscreenCatalog";
import {
  DEFAULT_BUTTON_STYLE,
  type CatalogButtonStyle,
} from "@/lib/button-style";
import { DEFAULT_EXAMPLE_PDF } from "@/lib/example-pdfs";
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

type CatalogTab = "embed" | "button";

export function HomeClient() {
  const [input, setInput] = useState("");
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [tab, setTab] = useState<CatalogTab>("embed");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [buttonStyle, setButtonStyle] =
    useState<CatalogButtonStyle>(DEFAULT_BUTTON_STYLE);
  const [buttonClass, setButtonClass] = useState("");
  const [buttonLabel, setButtonLabel] = useState("Open catalog");
  const [buttonOptionsTab, setButtonOptionsTab] =
    useState<ButtonOptionsTab>("style");

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
      <header className="max-w-3xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[#6b2d5b]">
          Flipper
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-[1.1] text-[#1a1410] sm:text-5xl">
          Turn any public PDF into a flipbook.
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
                setInput(DEFAULT_EXAMPLE_PDF);
                applyUrl(DEFAULT_EXAMPLE_PDF);
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
          <div className="flex gap-2 border-b border-[#d9cbb8]">
            <TabButton
              active={tab === "embed"}
              onClick={() => setTab("embed")}
              label="Catalog embed"
            />
            <TabButton
              active={tab === "button"}
              onClick={() => setTab("button")}
              label="Catalog button"
            />
          </div>

          {tab === "embed" ? (
            <section className="overflow-hidden rounded-2xl border border-[#1a1410]/10 bg-[#fff] shadow-[0_20px_50px_-28px_rgba(26,20,16,0.55)]">
              <Flipbook pdfUrl={activeUrl} className="h-full" />
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border bg-white border-[#1a1410]/10 shadow-[0_20px_50px_-28px_rgba(26,20,16,0.55)]">
              <CatalogButtonPreview
                label={buttonLabel}
                style={buttonStyle}
                buttonClass={buttonClass}
                optionsTab={buttonOptionsTab}
                onOptionsTabChange={setButtonOptionsTab}
                onLabelChange={setButtonLabel}
                onStyleChange={setButtonStyle}
                onClassChange={setButtonClass}
                onOpen={() => setCatalogOpen(true)}
              />
            </section>
          )}

          <EmbedCode
            origin={origin || "https://your-domain"}
            pdfUrl={activeUrl}
            mode={tab}
            buttonStyle={tab === "button" ? buttonStyle : undefined}
            buttonClass={tab === "button" ? buttonClass : undefined}
            buttonLabel={tab === "button" ? buttonLabel : undefined}
            preferButtonClass={
              tab === "button" && buttonOptionsTab === "class"
            }
          />

          <p className="font-sans text-sm text-[#6b5c50]">
            The script is hosted here; your PDF stays on its original URL. Add the
            head script once per page. Use{" "}
            <code className="rounded bg-[#efe4d4] px-1 py-0.5 text-xs">
              type=&quot;button&quot;
            </code>{" "}
            on the div for a fullscreen opener; leave it off for the inline embed.
            Allowed sites are controlled by{" "}
            <code className="rounded bg-[#efe4d4] px-1 py-0.5 text-xs">
              EMBED_SITES
            </code>{" "}
            (domain allowlist).
          </p>
        </>
      )}

      {activeUrl && catalogOpen && (
        <FullscreenCatalog pdfUrl={activeUrl} onClose={() => setCatalogOpen(false)} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 font-sans text-sm font-medium transition ${
        active
          ? "border-[#6b2d5b] text-[#6b2d5b]"
          : "border-transparent text-[#6b5c50] hover:text-[#1a1410]"
      }`}
    >
      {label}
    </button>
  );
}
