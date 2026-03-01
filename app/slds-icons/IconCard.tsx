"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { IconInfo } from "@/lib/icon-utils";
import { CopyText } from "@/components/CopyText";
import { CopyButton } from "@/components/CopyButton";

interface IconCardProps {
  icon: IconInfo;
  size: "xx-small" | "x-small" | "small" | "medium" | "large";
  variant: "default" | "inverse" | "success" | "error" | "warning";
  onCopy?: (message: string) => void;
}

const SIZE_CLASSES = {
  "xx-small": "w-3 h-3",
  "x-small": "w-4 h-4",
  small: "w-5 h-5",
  medium: "w-6 h-6",
  large: "w-8 h-8",
};

const spriteContentCache = new Map<string, string>();

function previewStyleForVariant(
  category: string,
  variant: "default" | "inverse" | "success" | "error" | "warning"
): {
  iconColor: string;
  chipStyle?: CSSProperties;
} {
  const isUtility = category === "utility";
  if (!isUtility || variant === "default") {
    return {
      iconColor: "var(--text-primary)",
    };
  }

  if (variant === "inverse") {
    return {
      iconColor: "#ffffff",
      chipStyle: {
        backgroundColor: "#032d60",
      },
    };
  }

  if (variant === "success") {
    return {
      iconColor: "#2e844a",
    };
  }

  if (variant === "error") {
    return {
      iconColor: "#ea001e",
    };
  }

  return {
    iconColor: "#dd7a01",
  };
}

function extractSymbolSvg(spriteContent: string, symbolId: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(spriteContent, "image/svg+xml");
    const symbols = Array.from(doc.getElementsByTagName("symbol"));
    const symbol = symbols.find((item) => item.getAttribute("id") === symbolId);
    if (!symbol) {
      return null;
    }

    const viewBox = symbol.getAttribute("viewBox") || "0 0 52 52";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${symbol.innerHTML}</svg>`;
  } catch (error) {
    console.error("Failed to extract symbol SVG:", error);
    return null;
  }
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/'/g, "&#39;");
}

export function IconCard({ icon, size, variant, onCopy }: IconCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const hideActionsTimeoutRef = useRef<number | null>(null);

  const iconName = icon.iconName || `${icon.category}:${icon.name}`;
  const symbolId = icon.symbolId || icon.name;
  const iconText = icon.name.replace(/[_-]+/g, " ").trim();
  const iconTextEscaped = escapeHtmlAttr(iconText);
  const canRenderSprite = Boolean(icon.spritePath && symbolId);
  const hasPng = Boolean(icon.pngPath120 || icon.pngPath60);
  const sizeClass = SIZE_CLASSES[size];
  const previewStyle = previewStyleForVariant(icon.category, variant);

  useEffect(() => {
    return () => {
      if (hideActionsTimeoutRef.current !== null) {
        window.clearTimeout(hideActionsTimeoutRef.current);
      }
    };
  }, []);

  const clearHideActionsTimer = () => {
    if (hideActionsTimeoutRef.current !== null) {
      window.clearTimeout(hideActionsTimeoutRef.current);
      hideActionsTimeoutRef.current = null;
    }
  };

  const scheduleHideActions = () => {
    clearHideActionsTimer();
    hideActionsTimeoutRef.current = window.setTimeout(() => {
      setShowActions(false);
      hideActionsTimeoutRef.current = null;
    }, 150);
  };

  const loadSpriteContent = async () => {
    if (!icon.spritePath) {
      return null;
    }

    const cached = spriteContentCache.get(icon.spritePath);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(icon.spritePath);
      const text = await response.text();
      spriteContentCache.set(icon.spritePath, text);
      return text;
    } catch (error) {
      console.error("Failed to load sprite:", error);
      return null;
    }
  };

  const loadSvgContent = async () => {
    if (svgContent) return svgContent;

    if (icon.svgPath) {
      try {
        const response = await fetch(icon.svgPath);
        const text = await response.text();
        setSvgContent(text);
        return text;
      } catch (error) {
        console.error("Failed to load SVG:", error);
        return null;
      }
    }

    if (icon.spritePath) {
      const spriteContent = await loadSpriteContent();
      if (!spriteContent) {
        return null;
      }
      const symbolSvg = extractSymbolSvg(spriteContent, symbolId);
      if (symbolSvg) {
        setSvgContent(symbolSvg);
      }
      return symbolSvg;
    }

    return null;
  };

  const copyToClipboard = async (text: string, message?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopy?.(message || "Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      onCopy?.("Failed to copy");
    }
  };

  const copyIconName = () => {
    copyToClipboard(iconName, `Copied: ${iconName}`);
  };

  const downloadSVG = async () => {
    const svg = await loadSvgContent();
    if (svg) {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${icon.name}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onCopy?.("Downloaded SVG!");
    }
  };

  const downloadPNG = () => {
    // Prefer higher resolution PNG if available
    const pngPath = icon.pngPath120 || icon.pngPath60;
    if (!pngPath) {
      onCopy?.("PNG not available for this icon");
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${icon.name}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onCopy?.("Downloaded PNG!");
          }
        }, "image/png");
      }
    };
    img.onerror = () => {
      onCopy?.("Failed to download PNG");
    };
    img.src = pngPath;
  };

  return (
    <div
      className="group relative flex flex-col items-center rounded-[0.5em] bg-[var(--content-color)] text-[var(--content-text)] p-2 transition-all cursor-pointer"
      style={{
        boxShadow: '0 0 0.625em var(--shadow-color)',
      }}
      onMouseEnter={(e) => {
        clearHideActionsTimer();
        setShowActions(true);
        e.currentTarget.style.boxShadow = '0 0 0 0.1875em var(--primary-color), 0 0 0.625em var(--shadow-color)';
      }}
      onMouseLeave={(e) => {
        scheduleHideActions();
        e.currentTarget.style.boxShadow = '0 0 0.625em var(--shadow-color)';
      }}
      onFocus={() => {
        clearHideActionsTimer();
        setShowActions(true);
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) {
          return;
        }
        scheduleHideActions();
      }}
      onClick={copyIconName}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          copyIconName();
        }
      }}
    >
      {/* Icon Preview */}
      <div className={`${sizeClass} mb-1.5 flex items-center justify-center`}>
        <span
          className="flex h-full w-full items-center justify-center rounded p-[2px]"
          style={previewStyle.chipStyle}
        >
        {canRenderSprite ? (
          <svg
            className="h-full w-full object-contain"
            aria-hidden="true"
            viewBox="0 0 52 52"
            style={{ fill: previewStyle.iconColor }}
          >
            <use href={`${icon.spritePath}#${symbolId}`} xlinkHref={`${icon.spritePath}#${symbolId}`} />
          </svg>
        ) : (
          <img
            src={icon.svgPath || ""}
            alt={iconName}
            className="h-full w-full object-contain"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        )}
        </span>
      </div>

      {/* Icon Name */}
      <div className="w-full truncate text-center text-xs text-[var(--text-secondary)] leading-tight">
        {icon.name}
      </div>

      {showActions && (
        <div
          className="absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-[0.5em] border border-[var(--content-border)] bg-[var(--content-color)] p-2 shadow-lg"
          style={{
            boxShadow: "0 0.5em 1em var(--shadow-color)",
          }}
          onMouseEnter={clearHideActionsTimer}
          onMouseLeave={scheduleHideActions}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2">
            <CopyText
              text={iconName}
              className="w-full truncate font-mono text-xs text-[var(--text-primary)]"
              onCopied={() => onCopy?.(`Copied: ${iconName}`)}
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <CopyButton
              label="Copy LWC"
              getValue={() =>
                `<lightning-icon icon-name='${iconName}' alternative-text='${iconTextEscaped}' variant='${variant}' size='${size}' title='${iconTextEscaped}'></lightning-icon>`
              }
              onCopied={() => onCopy?.("Copied LWC code!")}
              onCopyFailed={() => onCopy?.("Failed to copy")}
              className="cursor-pointer rounded border border-[var(--input-border)] px-2 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            />
            <CopyButton
              label="Copy SVG"
              getValue={loadSvgContent}
              onCopied={() => onCopy?.("Copied SVG!")}
              onCopyFailed={() => onCopy?.("Failed to copy")}
              className="cursor-pointer rounded border border-[var(--input-border)] px-2 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            />
            <ActionButton onClick={downloadSVG} label="Download SVG" />
            <ActionButton
              onClick={downloadPNG}
              label="Download PNG"
              disabled={!hasPng}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) {
          return;
        }
        onClick();
      }}
      className={`rounded border px-2 py-1 text-[11px] transition-colors ${
        disabled
          ? "cursor-not-allowed border-[var(--content-border)] text-[var(--text-tertiary)] opacity-60"
          : "cursor-pointer border-[var(--input-border)] text-[var(--text-secondary)] hover:border-[var(--primary-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
      }`}
      title={label}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
