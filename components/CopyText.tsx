"use client";

import { useEffect, useState, type MouseEvent } from "react";

interface CopyTextProps {
  text: string;
  className?: string;
  copiedDurationMs?: number;
  onCopied?: (value: string) => void;
}

export function CopyText({
  text,
  className = "",
  copiedDurationMs = 1200,
  onCopied,
}: CopyTextProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, copiedDurationMs);

    return () => window.clearTimeout(timeout);
  }, [copiedDurationMs, isCopied]);

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

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!copyWithFallback(text)) {
        return;
      }
      setIsCopied(true);
      onCopied?.(text);
    } catch {
      copyWithFallback(text);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-[var(--hover-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] cursor-pointer ${className}`}
      title={isCopied ? "Copied" : "Click to copy"}
      aria-label={isCopied ? "Copied" : "Copy text"}
    >
      <span className="truncate">{text}</span>
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {isCopied ? (
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </button>
  );
}
