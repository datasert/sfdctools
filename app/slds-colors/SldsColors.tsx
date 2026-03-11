"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import type { SldsStylingHook } from "@/lib/slds-styling-hooks";

interface SldsColorsProps {
  initialColors: SldsStylingHook[];
}

interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
}

interface ColorSwatch {
  hook: SldsStylingHook;
  cssColor: string;
  formats: ColorFormats;
}

interface ColorGroup {
  key: string;
  label: string;
  swatches: ColorSwatch[];
}

interface ColorSection {
  key: string;
  label: string;
  order: number;
  groups: ColorGroup[];
}

interface HoverPopover {
  id: string;
  left: number;
  top: number;
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

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
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

  const alpha = parts[3] !== undefined ? Number.parseFloat(parts[3]) : 1;
  if (!Number.isFinite(alpha)) {
    return null;
  }

  return { r, g, b, a: clampAlpha(alpha) };
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

  const alpha = parts[3] !== undefined ? Number.parseFloat(parts[3]) : 1;
  if (!Number.isFinite(alpha)) {
    return null;
  }

  return { ...rgb, a: clampAlpha(alpha) };
}

function parseColor(value: string): ParsedColor | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("{!")) {
    return null;
  }
  if (trimmed.startsWith("#")) return parseHexColor(trimmed);
  if (/^rgba?\(/i.test(trimmed)) return parseRgbColor(trimmed);
  if (/^hsla?\(/i.test(trimmed)) return parseHslColor(trimmed);
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

function colorFormats(value: string): ColorFormats | null {
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

function displayHookColorValue(hook: SldsStylingHook): string | null {
  if (hook.resolvedValue && !hook.resolvedValue.includes("{!")) {
    return hook.resolvedValue;
  }
  if (hook.value && !hook.value.includes("{!")) {
    return hook.value;
  }
  return null;
}

function swatchGroupKey(name: string): { group: string; order: number } {
  const normalized = name.replace(/^color-/, "");
  const match = normalized.match(/^(.*?)-(\d+)$/);
  if (match) {
    return {
      group: match[1],
      order: Number.parseInt(match[2], 10),
    };
  }
  return { group: normalized, order: Number.MAX_SAFE_INTEGER };
}

function groupLabel(group: string): string {
  const stripped = group.replace(/^palette-/, "");
  return stripped
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function sectionMetaForHook(hook: SldsStylingHook): { key: string; label: string; order: number } {
  const name = hook.name.toLowerCase();
  const category = hook.category.toLowerCase();

  if (name.startsWith("color-palette-")) {
    return { key: "palette", label: "Color Palette", order: 1 };
  }

  if (
    name.startsWith("color-neutral-base-") ||
    name.startsWith("color-brand-base-") ||
    name.startsWith("color-error-base-") ||
    name.startsWith("color-warning-base-") ||
    name.startsWith("color-success-base-")
  ) {
    return { key: "system", label: "System Colors", order: 2 };
  }

  if (name.startsWith("color-surface-") || name.startsWith("color-on-surface-")) {
    return { key: "surface", label: "Surface Colors", order: 3 };
  }

  if (name.startsWith("color-accent-") || name.startsWith("color-on-accent-")) {
    return { key: "accent", label: "Accent Colors", order: 4 };
  }

  if (
    name.startsWith("color-success-") ||
    name.startsWith("color-on-success-") ||
    name.startsWith("color-warning-") ||
    name.startsWith("color-on-warning-") ||
    name.startsWith("color-error-") ||
    name.startsWith("color-on-error-")
  ) {
    return { key: "feedback", label: "Feedback Colors", order: 5 };
  }

  if (name.startsWith("color-border-")) {
    return { key: "border", label: "Border Colors", order: 6 };
  }

  if (category.includes("transparent") || name.includes("-opacity-")) {
    return { key: "transparent", label: "Transparent Colors", order: 7 };
  }

  return { key: "other", label: "Other Colors", order: 8 };
}

function buildColorGroups(swatches: ColorSwatch[]): ColorGroup[] {
  const grouped = new Map<string, ColorSwatch[]>();
  for (const swatch of swatches) {
    const { group } = swatchGroupKey(swatch.hook.name);
    const current = grouped.get(group) ?? [];
    current.push(swatch);
    grouped.set(group, current);
  }

  return Array.from(grouped.entries())
    .map(([key, colorSwatches]) => {
      const sortedSwatches = colorSwatches.slice().sort((a, b) => {
        const aSort = swatchGroupKey(a.hook.name);
        const bSort = swatchGroupKey(b.hook.name);
        if (aSort.order !== bSort.order) {
          return aSort.order - bSort.order;
        }
        return a.hook.name.localeCompare(b.hook.name);
      });

      return {
        key,
        label: groupLabel(key),
        swatches: sortedSwatches,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function SldsColors({ initialColors }: SldsColorsProps) {
  const { showToast, ToastComponent } = useToast();
  const [search, setSearch] = useState("");
  const [hoverPopover, setHoverPopover] = useState<HoverPopover | null>(null);
  const hidePopoverTimeoutRef = useRef<number | null>(null);

  const swatches = useMemo<ColorSwatch[]>(() => {
    return initialColors
      .map((hook) => {
        const cssColor = displayHookColorValue(hook);
        if (!cssColor) return null;
        const formats = colorFormats(cssColor);
        if (!formats) return null;
        return { hook, cssColor, formats };
      })
      .filter((item): item is ColorSwatch => item !== null);
  }, [initialColors]);

  const filteredSwatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return swatches;
    }

    return swatches.filter(({ hook, cssColor, formats }) => {
      return (
        hook.cssVar.toLowerCase().includes(query) ||
        hook.name.toLowerCase().includes(query) ||
        hook.group.toLowerCase().includes(query) ||
        hook.category.toLowerCase().includes(query) ||
        hook.comment.toLowerCase().includes(query) ||
        hook.value.toLowerCase().includes(query) ||
        hook.resolvedValue.toLowerCase().includes(query) ||
        cssColor.toLowerCase().includes(query) ||
        formats.hex.toLowerCase().includes(query) ||
        formats.rgb.toLowerCase().includes(query) ||
        formats.hsl.toLowerCase().includes(query)
      );
    });
  }, [search, swatches]);

  const groupedSections = useMemo<ColorSection[]>(() => {
    const sectionMap = new Map<
      string,
      {
        key: string;
        label: string;
        order: number;
        swatches: ColorSwatch[];
      }
    >();

    for (const swatch of filteredSwatches) {
      const section = sectionMetaForHook(swatch.hook);
      const existing = sectionMap.get(section.key);
      if (existing) {
        existing.swatches.push(swatch);
      } else {
        sectionMap.set(section.key, {
          key: section.key,
          label: section.label,
          order: section.order,
          swatches: [swatch],
        });
      }
    }

    return Array.from(sectionMap.values())
      .map((section) => ({
        key: section.key,
        label: section.label,
        order: section.order,
        groups: buildColorGroups(section.swatches),
      }))
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.label.localeCompare(b.label);
      });
  }, [filteredSwatches]);

  const swatchById = useMemo(
    () => new Map(filteredSwatches.map((swatch) => [swatch.hook.cssVar, swatch])),
    [filteredSwatches]
  );

  useEffect(() => {
    return () => {
      if (hidePopoverTimeoutRef.current !== null) {
        window.clearTimeout(hidePopoverTimeoutRef.current);
      }
    };
  }, []);

  const clearHidePopoverTimer = () => {
    if (hidePopoverTimeoutRef.current !== null) {
      window.clearTimeout(hidePopoverTimeoutRef.current);
      hidePopoverTimeoutRef.current = null;
    }
  };

  const getPopoverPosition = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const popoverWidth = 290;
    const popoverHeight = 220;
    const gutter = 8;
    const gap = 10;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < gutter) {
      left = gutter;
    }
    if (left + popoverWidth > window.innerWidth - gutter) {
      left = window.innerWidth - popoverWidth - gutter;
    }

    let top = rect.bottom + gap;
    if (top + popoverHeight > window.innerHeight - gutter) {
      top = window.innerHeight - popoverHeight - gutter;
    }
    if (top < gutter) {
      top = gutter;
    }

    return { left, top };
  };

  const showPopover = (target: HTMLElement, swatchId: string) => {
    clearHidePopoverTimer();
    const { left, top } = getPopoverPosition(target);
    setHoverPopover({ id: swatchId, left, top });
  };

  const scheduleHidePopover = () => {
    clearHidePopoverTimer();
    hidePopoverTimeoutRef.current = window.setTimeout(() => {
      setHoverPopover(null);
      hidePopoverTimeoutRef.current = null;
    }, 120);
  };

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

  const copyText = async (value: string, message: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!copyWithFallback(value)) {
        showToast("Failed to copy", "error");
        return;
      }
      showToast(message, "success");
    } catch {
      const copied = copyWithFallback(value);
      showToast(copied ? message : "Failed to copy", copied ? "success" : "error");
    }
  };

  const hoveredSwatch = hoverPopover ? swatchById.get(hoverPopover.id) : null;

  return (
    <>
      {ToastComponent}
      <div className="h-full overflow-y-auto p-3">
        <div className="mb-3 flex items-center gap-2">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search colors..."
            className="w-52"
          />
          <div className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
            {filteredSwatches.length} color{filteredSwatches.length !== 1 ? "s" : ""}
          </div>
        </div>
        {groupedSections.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
            No colors found
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSections.map((section) => (
              <div key={section.key} className="space-y-2">
                <div className="border-b border-[var(--content-border)] pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  {section.label}
                </div>
                <div className="space-y-3">
                  {section.groups.map((group) => (
                    <div key={`${section.key}-${group.key}`} className="flex items-center gap-3">
                      <div className="w-36 flex-shrink-0 text-xs font-semibold text-[var(--text-secondary)]">
                        {group.label}
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
                        {group.swatches.map(({ hook, cssColor, formats }) => (
                          <div
                            key={hook.cssVar}
                            onClick={() => void copyText(hook.cssVar, "Copied hook name")}
                            onMouseEnter={(event) => showPopover(event.currentTarget, hook.cssVar)}
                            onMouseLeave={scheduleHidePopover}
                            onFocus={(event) => showPopover(event.currentTarget, hook.cssVar)}
                            onBlur={scheduleHidePopover}
                            onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                void copyText(hook.cssVar, "Copied hook name");
                              }
                            }}
                            className="group relative h-12 w-12 flex-shrink-0 overflow-visible rounded-md border border-[var(--content-border)] bg-[var(--content-color)] cursor-pointer transition-all hover:border-[var(--primary-color)] hover:shadow-[0_0_0_1px_var(--primary-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]"
                            title={`${hook.cssVar}\n${formats.hex}`}
                            aria-label={`Copy ${hook.cssVar}`}
                            role="button"
                            tabIndex={0}
                          >
                            <span
                              className="absolute inset-0 rounded-md"
                              style={{ backgroundColor: cssColor }}
                            />
                            <span className="pointer-events-none absolute inset-0 rounded-md border border-black/5 dark:border-white/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {hoverPopover && hoveredSwatch ? (
        <div
          className="fixed z-50 w-[290px] rounded-md border border-[var(--content-border)] bg-[var(--content-color)] text-left shadow-lg"
          style={{ left: `${hoverPopover.left}px`, top: `${hoverPopover.top}px` }}
          onMouseEnter={clearHidePopoverTimer}
          onMouseLeave={scheduleHidePopover}
        >
          <ValueCopyRow
            label="Hook Name"
            value={hoveredSwatch.hook.cssVar}
            onClick={() => {
              void copyText(hoveredSwatch.hook.cssVar, "Copied hook name");
            }}
          />
          <ValueCopyRow
            label="HEX"
            value={hoveredSwatch.formats.hex}
            onClick={() => {
              void copyText(hoveredSwatch.formats.hex, "Copied HEX");
            }}
          />
          <ValueCopyRow
            label="RGB"
            value={hoveredSwatch.formats.rgb}
            onClick={() => {
              void copyText(hoveredSwatch.formats.rgb, "Copied RGB");
            }}
          />
          <ValueCopyRow
            label="HSL"
            value={hoveredSwatch.formats.hsl}
            onClick={() => {
              void copyText(hoveredSwatch.formats.hsl, "Copied HSL");
            }}
          />
          <ValueCopyRow
            label="Usage"
            value={`color: var(${hoveredSwatch.hook.cssVar});`}
            onClick={() => {
              void copyText(`color: var(${hoveredSwatch.hook.cssVar});`, "Copied usage");
            }}
          />
        </div>
      ) : null}
    </>
  );
}

function ValueCopyRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-[var(--hover-bg)]"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</div>
      <div className="truncate font-mono text-xs text-[var(--text-primary)]">{value}</div>
    </button>
  );
}
