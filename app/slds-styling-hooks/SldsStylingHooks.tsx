"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CopyText } from "@/components/CopyText";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { SldsStylingHook, SldsHookPreviewType } from "@/lib/slds-styling-hooks";

interface SldsStylingHooksProps {
  initialHooks: SldsStylingHook[];
  availableTypes: SldsHookPreviewType[];
}

const STORAGE_KEY = "sfdc-tools:slds-styling-hooks";
const PX_BASE = 16;

function toPixelValue(value: string): string | null {
  if (!value) {
    return null;
  }

  let hasConvertibleUnit = false;
  const converted = value.replace(/(-?\d*\.?\d+)(rem|em)\b/gi, (_, rawNumber: string) => {
    hasConvertibleUnit = true;
    const px = Number.parseFloat(rawNumber) * PX_BASE;
    const normalized = Number.isInteger(px)
      ? String(px)
      : px.toFixed(3).replace(/\.?0+$/, "");
    return `${normalized}px`;
  });

  return hasConvertibleUnit ? converted : null;
}

function withPixelDetails(value: string): string {
  if (!value) {
    return "(empty)";
  }

  const pixelValue = toPixelValue(value);
  return pixelValue ? `${value} / ${pixelValue}` : value;
}

function displayHookValue(hook: SldsStylingHook): string {
  if (hook.resolvedValue && !hook.resolvedValue.includes("{!")) {
    return hook.resolvedValue;
  }
  if (hook.value && !hook.value.includes("{!")) {
    return hook.value;
  }
  return "SLDS alias value";
}

interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clampColorChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampAlpha(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function formatAlpha(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function parseHexColor(value: string): ParsedColor | null {
  const hex = value.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(hex.length) || !/^[a-fA-F0-9]+$/.test(hex)) {
    return null;
  }

  const normalized =
    hex.length === 3 || hex.length === 4
      ? hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hex;

  const hasAlpha = normalized.length === 8;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const a = hasAlpha ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
}

function parseRgbPart(raw: string): number | null {
  const part = raw.trim();
  if (!part) {
    return null;
  }

  if (part.endsWith("%")) {
    const percent = Number.parseFloat(part.slice(0, -1));
    if (!Number.isFinite(percent)) {
      return null;
    }
    return clampColorChannel((percent / 100) * 255);
  }

  const number = Number.parseFloat(part);
  return Number.isFinite(number) ? clampColorChannel(number) : null;
}

function parseRgbColor(value: string): ParsedColor | null {
  const match = value.trim().match(/^rgba?\((.+)\)$/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .replace(/\s*\/\s*/g, ",")
    .split(",")
    .map((part) => part.trim());

  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const r = parseRgbPart(parts[0]);
  const g = parseRgbPart(parts[1]);
  const b = parseRgbPart(parts[2]);
  if (r === null || g === null || b === null) {
    return null;
  }

  const a =
    parts[3] !== undefined
      ? clampAlpha(Number.parseFloat(parts[3]))
      : 1;

  if (parts[3] !== undefined && !Number.isFinite(Number.parseFloat(parts[3]))) {
    return null;
  }

  return { r, g, b, a };
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (hp >= 5 && hp < 6) [r1, g1, b1] = [c, 0, x];

  const m = l - c / 2;
  return {
    r: clampColorChannel((r1 + m) * 255),
    g: clampColorChannel((g1 + m) * 255),
    b: clampColorChannel((b1 + m) * 255),
  };
}

function parseHslColor(value: string): ParsedColor | null {
  const match = value.trim().match(/^hsla?\((.+)\)$/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .replace(/\s*\/\s*/g, ",")
    .split(",")
    .map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const hue = Number.parseFloat(parts[0]);
  const sat = parts[1].endsWith("%") ? Number.parseFloat(parts[1].slice(0, -1)) : Number.NaN;
  const light = parts[2].endsWith("%") ? Number.parseFloat(parts[2].slice(0, -1)) : Number.NaN;
  if (!Number.isFinite(hue) || !Number.isFinite(sat) || !Number.isFinite(light)) {
    return null;
  }

  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSat = Math.min(100, Math.max(0, sat)) / 100;
  const normalizedLight = Math.min(100, Math.max(0, light)) / 100;
  const rgb = hslToRgb(normalizedHue, normalizedSat, normalizedLight);

  const alpha = parts[3] !== undefined ? clampAlpha(Number.parseFloat(parts[3])) : 1;
  if (parts[3] !== undefined && !Number.isFinite(Number.parseFloat(parts[3]))) {
    return null;
  }

  return { ...rgb, a: alpha };
}

function parseColor(value: string): ParsedColor | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("{!")) {
    return null;
  }

  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }
  if (/^rgba?\(/i.test(trimmed)) {
    return parseRgbColor(trimmed);
  }
  if (/^hsla?\(/i.test(trimmed)) {
    return parseHslColor(trimmed);
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  return {
    h: Math.round((h + 360) % 360),
    s: +(s * 100).toFixed(1),
    l: +(l * 100).toFixed(1),
  };
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function colorFormats(value: string): { hex: string; rgb: string; hsl: string } | null {
  const parsed = parseColor(value);
  if (!parsed) {
    return null;
  }

  const { r, g, b, a } = parsed;
  const alphaHex = toHex(Math.round(clampAlpha(a) * 255));
  const hex = a < 1 ? `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}` : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  const rgb = a < 1 ? `rgba(${r}, ${g}, ${b}, ${formatAlpha(a)})` : `rgb(${r}, ${g}, ${b})`;
  const hslObj = rgbToHsl(r, g, b);
  const hsl =
    a < 1
      ? `hsla(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%, ${formatAlpha(a)})`
      : `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`;

  return { hex, rgb, hsl };
}

function defaultUsageProperty(previewType: SldsHookPreviewType): string {
  if (previewType === "Color") return "color";
  if (previewType === "Shadow") return "box-shadow";
  if (previewType === "Radius") return "border-radius";
  if (previewType === "Border Width") return "border-width";
  if (previewType === "Spacing") return "gap";
  if (previewType === "Sizing") return "width";
  if (previewType === "Ratio") return "aspect-ratio";
  if (previewType === "Font Family") return "font-family";
  if (previewType === "Font Size") return "font-size";
  if (previewType === "Font Weight") return "font-weight";
  if (previewType === "Line Height") return "line-height";
  return "color";
}

function usageLinesForHook(hook: SldsStylingHook): string[] {
  const usageProperties = hook.cssProperties.length
    ? hook.cssProperties
    : [defaultUsageProperty(hook.previewType)];
  const primaryProperty = usageProperties[0];
  const secondaryProperty = usageProperties.find((property) => property !== primaryProperty);
  const lines = [`${primaryProperty}: var(${hook.cssVar});`];

  if (secondaryProperty) {
    lines.push(`${secondaryProperty}: var(${hook.cssVar});`);
  }

  return Array.from(new Set(lines)).slice(0, 3);
}

function parseRatioValue(value: string): number | null {
  const normalized = value.trim();
  if (!normalized || normalized.includes("{!")) {
    return null;
  }

  if (normalized.includes("/")) {
    const [left, right] = normalized.split("/");
    const numerator = Number.parseFloat(left);
    const denominator = Number.parseFloat(right);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }
    const result = numerator / denominator;
    return result > 0 ? result : null;
  }

  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function ratioPreviewStyle(value: string) {
  const ratio = parseRatioValue(value) ?? 1;
  const height = 42;
  const width = Math.min(92, Math.max(18, Math.round(height * ratio)));
  return {
    width: `${width}px`,
    height: `${height}px`,
  };
}

function HookPreview({ hook }: { hook: SldsStylingHook }) {
  const value = hook.resolvedValue || hook.value;
  const hasPreviewValue = !!value && !value.includes("{!");

  if (hook.previewType === "Color") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-2">
        {hasPreviewValue ? (
          <div
            className="h-full w-full rounded"
            style={{ background: value }}
            title={value}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-[var(--content-border)] text-xs text-[var(--text-tertiary)]">
            Alias Value
          </div>
        )}
      </div>
    );
  }

  if (hook.previewType === "Shadow") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="h-full w-full rounded bg-[var(--content-color)]"
          style={hasPreviewValue ? { boxShadow: value } : undefined}
          title={value}
        />
      </div>
    );
  }

  if (hook.previewType === "Radius") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="h-full w-full border border-[var(--content-border)] bg-[var(--content-color)]"
          style={hasPreviewValue ? { borderRadius: value } : undefined}
          title={value}
        />
      </div>
    );
  }

  if (hook.previewType === "Border Width") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="h-full w-full rounded border-solid bg-[var(--content-color)]"
          style={
            hasPreviewValue
              ? {
                  borderWidth: value,
                  borderColor: "var(--text-secondary)",
                }
              : undefined
          }
          title={value}
        />
      </div>
    );
  }

  if (hook.previewType === "Spacing") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-2"
          style={hasPreviewValue ? { gap: value } : undefined}
          title={value}
        >
          <div className="h-7 w-7 rounded bg-[var(--primary-color)] opacity-75" />
          <div className="h-7 w-7 rounded bg-[var(--primary-color)] opacity-45" />
        </div>
      </div>
    );
  }

  if (hook.previewType === "Sizing") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-2">
          <div
            className="h-3 rounded bg-[var(--primary-color)]"
            style={hasPreviewValue ? { width: value, minWidth: "0.5rem" } : { width: "55%" }}
            title={value}
          />
        </div>
      </div>
    );
  }

  if (hook.previewType === "Ratio") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center justify-center rounded border border-[var(--content-border)] bg-[var(--content-color)]">
          <div
            className="rounded bg-[var(--primary-color)] opacity-70"
            style={hasPreviewValue ? ratioPreviewStyle(value) : ratioPreviewStyle("1")}
            title={value}
          />
        </div>
      </div>
    );
  }

  if (hook.previewType === "Font Family") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-3 text-sm text-[var(--text-primary)]"
          style={hasPreviewValue ? { fontFamily: value } : undefined}
          title={value}
        >
          ABC abc 123
        </div>
      </div>
    );
  }

  if (hook.previewType === "Font Size") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-3 text-[var(--text-primary)] overflow-hidden">
          <span
            className="truncate"
            style={hasPreviewValue ? { fontSize: value } : undefined}
          >
            The quick brown fox jumps over the lazy dog 0123456789
          </span>
        </div>
      </div>
    );
  }

  if (hook.previewType === "Font Weight") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-3 text-[var(--text-primary)] overflow-hidden">
          <span
            className="truncate"
            style={hasPreviewValue ? { fontWeight: value } : undefined}
          >
            The quick brown fox jumps over the lazy dog 0123456789
          </span>
        </div>
      </div>
    );
  }

  if (hook.previewType === "Line Height") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="line-clamp-2 h-full overflow-hidden rounded border border-[var(--content-border)] bg-[var(--content-color)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
          style={hasPreviewValue ? { lineHeight: value } : undefined}
          title={value}
        >
          Line one
          <br />
          Line two
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
      <div className="flex h-full items-center justify-center rounded border border-dashed border-[var(--content-border)] bg-[var(--content-color)] text-xs text-[var(--text-tertiary)]">
        No Preview
      </div>
    </div>
  );
}

function HookCard({
  hook,
  onCopy,
}: {
  hook: SldsStylingHook;
  onCopy: (message: string) => void;
}) {
  const showCategoryTag =
    !!hook.category &&
    hook.category.trim().toLowerCase() !== hook.previewType.trim().toLowerCase();
  const visibleValue = displayHookValue(hook);
  const formats = hook.previewType === "Color" ? colorFormats(visibleValue) : null;
  const usageLines = usageLinesForHook(hook);
  const usageText = usageLines.join("\n");
  const [isCopied, setIsCopied] = useState(false);
  const [isUsageCopied, setIsUsageCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  useEffect(() => {
    if (!isUsageCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsUsageCopied(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [isUsageCopied]);

  const copyWithFallback = (value: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  };

  const copyHookName = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(hook.cssVar);
      } else if (!copyWithFallback(hook.cssVar)) {
        onCopy("Failed to copy");
        return;
      }
      setIsCopied(true);
      onCopy("Copied hook name");
    } catch {
      const fallbackCopied = copyWithFallback(hook.cssVar);
      if (fallbackCopied) {
        setIsCopied(true);
      }
      onCopy(fallbackCopied ? "Copied hook name" : "Failed to copy");
    }
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void copyHookName();
    }
  };

  const copyUsage = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(usageText);
      } else if (!copyWithFallback(usageText)) {
        onCopy("Failed to copy");
        return;
      }
      setIsUsageCopied(true);
      onCopy("Copied usage");
    } catch {
      const fallbackCopied = copyWithFallback(usageText);
      if (fallbackCopied) {
        setIsUsageCopied(true);
      }
      onCopy(fallbackCopied ? "Copied usage" : "Failed to copy");
    }
  };

  return (
    <div
      className="group/card rounded-[0.5em] bg-[var(--content-color)] p-3 transition-all cursor-pointer hover:bg-[var(--hover-bg)]"
      style={{ boxShadow: "0 0 0.625em var(--shadow-color)" }}
      role="button"
      tabIndex={0}
      onClick={() => void copyHookName()}
      onKeyDown={handleCardKeyDown}
      title="Click to copy hook name"
      aria-label={`Copy ${hook.cssVar}`}
    >
      <HookPreview hook={hook} />

      <div className="mt-2.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CopyText
            text={hook.cssVar}
            className="min-w-0 flex-1 text-xs font-mono text-[var(--text-primary)]"
            onCopied={() => onCopy("Copied hook name")}
          />
          <span
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center transition-opacity ${
              isCopied
                ? "opacity-100 text-green-500"
                : "text-[var(--text-tertiary)] opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100"
            }`}
            aria-hidden="true"
          >
            {isCopied ? (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </span>
        </div>

        <div className="rounded border border-[var(--content-border)] bg-[var(--content-faded-color)] px-2 py-1 font-mono text-xs text-[var(--text-secondary)] break-all">
          {formats ? (
            <div className="space-y-1">
              <div>HEX: {formats.hex}</div>
              <div>RGB: {formats.rgb}</div>
              <div>HSL: {formats.hsl}</div>
            </div>
          ) : (
            withPixelDetails(visibleValue)
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void copyUsage();
          }}
          className="group/usage w-full rounded border border-[var(--content-border)] bg-[var(--content-faded-color)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--hover-bg)] cursor-pointer"
          title="Click to copy usage"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Usage
            </span>
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center transition-opacity ${
                isUsageCopied
                  ? "opacity-100 text-green-500"
                  : "text-[var(--text-tertiary)] opacity-0 group-hover/usage:opacity-100 group-focus-within/usage:opacity-100"
              }`}
              aria-hidden="true"
            >
              {isUsageCopied ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </span>
          </div>
          <div className="space-y-1">
            {usageLines.map((line) => (
              <div
                key={line}
                className="font-mono text-[11px] text-[var(--text-secondary)] break-all"
              >
                {line}
              </div>
            ))}
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-[var(--hover-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)]">
            {hook.previewType}
          </span>
          {showCategoryTag ? (
            <span className="rounded bg-[var(--hover-bg)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
              {hook.category}
            </span>
          ) : null}
          <span className="rounded bg-[var(--hover-bg)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
            {hook.type}
          </span>
        </div>

        {hook.comment ? (
          <p className="text-xs text-[var(--text-secondary)]">{hook.comment}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SldsStylingHooks({
  initialHooks,
  availableTypes,
}: SldsStylingHooksProps) {
  const [search, setSearch] = usePersistedState<string>(`${STORAGE_KEY}:search`, "");
  const [selectedTypes, setSelectedTypes] = usePersistedState<SldsHookPreviewType[]>(
    `${STORAGE_KEY}:types`,
    []
  );
  const { showToast, ToastComponent } = useToast();

  const filteredHooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialHooks.filter((hook) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(hook.previewType)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        hook.cssVar.toLowerCase().includes(query) ||
        hook.name.toLowerCase().includes(query) ||
        hook.value.toLowerCase().includes(query) ||
        hook.comment.toLowerCase().includes(query) ||
        hook.category.toLowerCase().includes(query) ||
        hook.previewType.toLowerCase().includes(query) ||
        hook.cssProperties.some((property) => property.toLowerCase().includes(query))
      );
    });
  }, [initialHooks, search, selectedTypes]);

  const toggleType = (type: SldsHookPreviewType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  };

  const selectAllTypes = () => {
    setSelectedTypes([]);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTypes([]);
  };

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border-color)] bg-[var(--card-bg)] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={selectAllTypes}
                className={`rounded-[0.375em] border px-2 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTypes.length === 0
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)]"
                    : "border-[var(--input-border)] bg-[var(--input-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                All
              </button>
              {availableTypes.map((type) => {
                const active = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`rounded-[0.375em] border px-2 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)]"
                        : "border-[var(--input-border)] bg-[var(--input-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search..."
              className="w-44 flex-shrink-0"
            />
            <Button
              variant="secondary"
              onClick={clearFilters}
              disabled={!search && selectedTypes.length === 0}
            >
              Clear
            </Button>
            <div className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
              {filteredHooks.length} hook{filteredHooks.length !== 1 ? "s" : ""}
            </div>
          </div>

        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredHooks.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
              No styling hooks found
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5">
              {filteredHooks.map((hook) => (
                <HookCard key={hook.cssVar} hook={hook} onCopy={showToast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
