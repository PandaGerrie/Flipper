"use client";

import { useEffect, useState } from "react";

import type { CatalogButtonStyle } from "@/lib/button-style";
import { buttonStyleToCss, DEFAULT_BUTTON_STYLE } from "@/lib/button-style";

export type ButtonOptionsTab = "style" | "class";

type CatalogButtonPreviewProps = {
  label: string;
  style?: CatalogButtonStyle;
  buttonClass: string;
  optionsTab: ButtonOptionsTab;
  onOptionsTabChange: (tab: ButtonOptionsTab) => void;
  onLabelChange: (next: string) => void;
  onStyleChange: (next: CatalogButtonStyle) => void;
  onClassChange: (next: string) => void;
  onOpen: () => void;
};

export function CatalogButtonPreview({
  label,
  style = DEFAULT_BUTTON_STYLE,
  buttonClass,
  optionsTab,
  onOptionsTabChange,
  onLabelChange,
  onStyleChange,
  onClassChange,
  onOpen,
}: CatalogButtonPreviewProps) {
  const useClass = optionsTab === "class" && buttonClass.trim().length > 0;
  const css = useClass ? { fontFamily: "inherit" as const } : buttonStyleToCss(style);
  const displayLabel = label.trim() || "Open catalog";

  function patch(partial: Partial<CatalogButtonStyle>) {
    onStyleChange({ ...style, ...partial });
  }

  return (
    <div className="flex flex-col gap-6 bg-[#fffaf3] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
        <p className="font-sans text-sm text-[#6b5c50]">
          Preview — click opens fullscreen flipbook
        </p>
        <button
          type="button"
          onClick={onOpen}
          style={css}
          className={
            useClass
              ? buttonClass.trim()
              : "px-5 py-3 text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(26,20,16,0.35)] transition hover:brightness-95"
          }
        >
          {displayLabel}
        </button>
        {optionsTab === "class" && (
          <p className="max-w-xs text-center font-sans text-xs text-[#6b5c50]">
            {buttonClass.trim()
              ? "Using your class names. Site CSS will not load here, so the preview can look plain."
              : "Enter class names to style the button with your site CSS."}
          </p>
        )}
      </div>

      <div className="grid w-full shrink-0 gap-3 rounded-2xl border border-[#e4d6c4] bg-[#fffaf3] p-4 sm:w-[280px]">
        <label className="flex flex-col gap-1.5 font-sans text-sm text-[#1a1410]">
          <span>Button label</span>
          <input
            type="text"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="Open catalog"
            className="h-10 rounded-lg border border-[#d9cbb8] bg-[#fffaf3] px-3 font-sans text-[13px] text-[#1a1410] outline-none ring-[#6b2d5b] placeholder:text-[#9a8776] focus:border-[#6b2d5b] focus:ring-2"
            aria-label="Button label"
            autoComplete="off"
          />
        </label>

        <div className="flex gap-1 border-b border-[#e4d6c4]">
          <OptionsTabButton
            active={optionsTab === "style"}
            onClick={() => onOptionsTabChange("style")}
            label="Style button"
          />
          <OptionsTabButton
            active={optionsTab === "class"}
            onClick={() => onOptionsTabChange("class")}
            label="Add button class"
          />
        </div>

        {optionsTab === "style" ? (
          <>
            <ColorField
              label="Background"
              value={style.backgroundColor}
              onChange={(backgroundColor) => patch({ backgroundColor })}
            />
            <ColorField
              label="Border color"
              value={style.borderColor}
              onChange={(borderColor) => patch({ borderColor })}
            />

            <label className="flex flex-col gap-1.5 font-sans text-sm text-[#1a1410]">
              <span className="flex items-center justify-between">
                Border width
                <span className="tabular-nums text-[#6b5c50]">{style.borderWidth}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={style.borderWidth}
                onChange={(event) => patch({ borderWidth: Number(event.target.value) })}
                className="w-full accent-[#6b2d5b]"
                aria-label="Border width"
              />
            </label>

            <label className="flex flex-col gap-1.5 font-sans text-sm text-[#1a1410]">
              <span className="flex items-center justify-between">
                Border radius
                <span className="tabular-nums text-[#6b5c50]">{style.borderRadius}px</span>
              </span>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={style.borderRadius}
                onChange={(event) =>
                  patch({ borderRadius: Number(event.target.value) })
                }
                className="w-full accent-[#6b2d5b]"
                aria-label="Border radius"
              />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-2 font-sans text-sm text-[#1a1410]">
            <span>CSS classes</span>
            <input
              type="text"
              value={buttonClass}
              onChange={(event) => onClassChange(event.target.value)}
              placeholder="btn btn-primary"
              className="h-10 rounded-lg border border-[#d9cbb8] bg-[#fffaf3] px-3 font-mono text-[13px] text-[#1a1410] outline-none ring-[#6b2d5b] placeholder:text-[#9a8776] focus:border-[#6b2d5b] focus:ring-2"
              aria-label="Button CSS classes"
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-xs leading-relaxed text-[#6b5c50]">
              Space-separated classes applied to the button on your site. Skips
              Flipper inline styles so your CSS can take over.
            </p>
          </label>
        )}
      </div>
    </div>
  );
}

function OptionsTabButton({
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
      className={`flex-1 border-b-2 px-2 py-2 font-sans text-xs font-medium transition ${
        active
          ? "border-[#6b2d5b] text-[#6b2d5b]"
          : "border-transparent text-[#6b5c50] hover:text-[#1a1410]"
      }`}
    >
      {label}
    </button>
  );
}

function normalizeHex(raw: string): string | null {
  let value = raw.trim();
  if (!value.startsWith("#")) value = `#${value}`;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [r, g, b] = value.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function toColorInputValue(hex: string): string {
  return normalizeHex(hex) ?? "#000000";
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [hexDraft, setHexDraft] = useState(value);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  function commitHex(raw: string) {
    const next = normalizeHex(raw);
    if (next) onChange(next);
    else setHexDraft(value);
  }

  return (
    <div className="flex items-center justify-between gap-3 font-sans text-sm text-[#1a1410]">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toColorInputValue(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-[#d9cbb8] bg-transparent p-0.5"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={hexDraft}
          onChange={(event) => {
            const raw = event.target.value;
            setHexDraft(raw);
            const next = normalizeHex(raw);
            if (next) onChange(next);
          }}
          onBlur={() => commitHex(hexDraft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          className="h-9 w-[5.75rem] rounded-md border border-[#d9cbb8] bg-[#fffaf3] px-2 font-mono text-[12px] uppercase tracking-wide text-[#1a1410] outline-none ring-[#6b2d5b] focus:border-[#6b2d5b] focus:ring-2"
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}
