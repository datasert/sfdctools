"use client";

import { useEffect, useState, type MouseEvent } from "react";

interface CopyButtonProps {
  label: string;
  getValue: () => string | null | Promise<string | null>;
  className?: string;
  copiedDurationMs?: number;
  disabled?: boolean;
  onCopied?: (value: string) => void;
  onCopyFailed?: () => void;
}

export function CopyButton({
  label,
  getValue,
  className = "",
  copiedDurationMs = 1200,
  disabled = false,
  onCopied,
  onCopyFailed,
}: CopyButtonProps) {
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

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (disabled) {
      return;
    }

    const value = await getValue();
    if (!value) {
      onCopyFailed?.();
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!copyWithFallback(value)) {
        onCopyFailed?.();
        return;
      }
      setIsCopied(true);
      onCopied?.(value);
    } catch {
      if (copyWithFallback(value)) {
        setIsCopied(true);
        onCopied?.(value);
      } else {
        onCopyFailed?.();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      title={isCopied ? "Copied" : label}
      aria-label={isCopied ? "Copied" : label}
    >
      {isCopied ? "Copied" : label}
    </button>
  );
}

