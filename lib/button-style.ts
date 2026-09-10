import type { CSSProperties } from "react";

export type CatalogButtonStyle = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
};

export const DEFAULT_BUTTON_STYLE: CatalogButtonStyle = {
  backgroundColor: "#6b2d5b",
  borderColor: "#6b2d5b",
  borderWidth: 0,
  borderRadius: 12,
};

/** Readable label color for a hex background. */
export function buttonTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace("#", "");
  if (hex.length !== 3 && hex.length !== 6) return "#fffaf3";
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1a1410" : "#fffaf3";
}

export function buttonStyleToCss(style: CatalogButtonStyle): CSSProperties {
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: style.borderWidth > 0 ? "solid" : "none",
    borderRadius: style.borderRadius,
    color: buttonTextColor(style.backgroundColor),
    fontFamily: "inherit",
  };
}

/** Keep only safe CSS class tokens. */
export function sanitizeButtonClass(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter((token) => /^[a-zA-Z_][\w-]*$/.test(token))
    .join(" ");
}

/** data-* attributes for the embed placeholder. */
export function buttonStyleToDataAttrs(style: CatalogButtonStyle): string[] {
  return [
    `data-bg="${style.backgroundColor}"`,
    `data-border-color="${style.borderColor}"`,
    `data-border-width="${style.borderWidth}px"`,
    `data-radius="${style.borderRadius}px"`,
  ];
}

/** Button styling attrs: custom class takes over; otherwise inline style data-*. */
export function buttonEmbedAttrs(
  style: CatalogButtonStyle,
  buttonClass?: string,
  preferClass = false,
): string[] {
  const safeClass = sanitizeButtonClass(buttonClass ?? "");
  if (preferClass && safeClass) {
    return [`data-class="${safeClass}"`];
  }
  return buttonStyleToDataAttrs(style);
}
