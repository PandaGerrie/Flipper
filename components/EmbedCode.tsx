"use client";

import { useState } from "react";

import type { CatalogButtonStyle } from "@/lib/button-style";
import { buttonEmbedAttrs, sanitizeButtonClass } from "@/lib/button-style";

export type EmbedMode = "embed" | "button";

type EmbedCodeProps = {
  origin: string;
  pdfUrl: string;
  mode: EmbedMode;
  buttonStyle?: CatalogButtonStyle;
  buttonClass?: string;
  buttonLabel?: string;
  preferButtonClass?: boolean;
};

export function EmbedCode({
  origin,
  pdfUrl,
  mode,
  buttonStyle,
  buttonClass,
  buttonLabel,
  preferButtonClass = false,
}: EmbedCodeProps) {
  const headSnippet = `<script\n  src="${origin}/embed.js"\n  defer\n></script>`;

  const label = (buttonLabel ?? "").trim() || "Open catalog";
  const bodyAttrs =
    mode === "button"
      ? [
          `class="fl-flipbook"`,
          `type="button"`,
          `data-src="${pdfUrl}"`,
          `data-label="${escapeAttr(label)}"`,
          ...(buttonStyle
            ? buttonEmbedAttrs(buttonStyle, buttonClass, preferButtonClass)
            : []),
        ]
      : [`class="fl-flipbook"`, `data-src="${pdfUrl}"`];

  const bodySnippet = formatTag("div", bodyAttrs);

  const usingClass =
    preferButtonClass && Boolean(sanitizeButtonClass(buttonClass ?? ""));
  const bodyHint =
    mode === "button"
      ? usingClass
        ? "Opens a fullscreen flipbook when clicked. The button uses data-class from your site CSS."
        : "Opens a fullscreen flipbook when clicked. Style comes from data-bg, data-border-*, and data-radius."
      : "Repeat this div for as many PDFs as you need. Optional: data-width, data-height.";

  const bodyTitle =
    mode === "button"
      ? "Drop this where the button should appear"
      : "Drop this where the book should appear";

  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2">
      <Snippet
        step="1"
        title="Add this in your <head>"
        hint="Add this script once per page or in the header of your site. The script finds every flipbook placeholder."
        code={headSnippet}
      />
      <Snippet step="2" title={bodyTitle} hint={bodyHint} code={bodySnippet} />
    </div>
  );
}

function formatTag(tag: string, attrs: string[]): string {
  return `<${tag}\n  ${attrs.join("\n  ")}\n></${tag}>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
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
    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-[#e4d6c4] bg-[#fffaf3] p-4 shadow-[0_1px_0_rgba(26,20,16,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
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
      <pre className="block min-h-0 w-full min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-[#1a1410] p-3 font-mono text-[12px] leading-relaxed text-[#f3eadb]">
        <code className="block w-full">{code}</code>
      </pre>
    </section>
  );
}
