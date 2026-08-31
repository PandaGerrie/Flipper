"use client";

import { useState } from "react";

type EmbedCodeProps = {
  origin: string;
  pdfUrl: string;
};

export function EmbedCode({ origin, pdfUrl }: EmbedCodeProps) {
  const headSnippet = `<script src="${origin}/embed.js" defer></script>`;
  const bodySnippet = `<div class="fl-flipbook" data-src="${pdfUrl}"></div>`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Snippet
        step="1"
        title="Add this in your <head>"
        hint="Once per page. The script finds every flipbook placeholder."
        code={headSnippet}
      />
      <Snippet
        step="2"
        title="Drop this where the book should appear"
        hint="Repeat this div for as many PDFs as you need. Optional: data-width, data-height."
        code={bodySnippet}
      />
    </div>
  );
}

function Snippet({
  step,
  title,
  hint,
  code,
}: {
  step: string;
  title: string;
  hint: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-2xl border border-[#e4d6c4] bg-[#fffaf3] p-4 shadow-[0_1px_0_rgba(26,20,16,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b2d5b]">
            Step {step}
          </p>
          <h2 className="mt-1 font-serif text-lg text-[#1a1410]">{title}</h2>
          <p className="mt-1 font-sans text-sm text-[#6b5c50]">{hint}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full border border-[#6b2d5b] px-3 py-1.5 font-sans text-xs font-medium text-[#6b2d5b] transition hover:bg-[#6b2d5b] hover:text-[#fffaf3]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-[#1a1410] p-3 font-mono text-[12px] leading-relaxed text-[#f3eadb]">
        <code>{code}</code>
      </pre>
    </section>
  );
}
