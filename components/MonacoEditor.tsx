"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Editor, { EditorProps, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorPaneActionContext } from "./EditorPane";
import { useTheme } from "./ThemeProvider";

interface MonacoEditorProps extends Omit<EditorProps, "theme" | "options"> {
  value: string;
  onChange?: OnChange;
  language?: string;
  height?: string;
  options?: editor.IStandaloneEditorConstructionOptions;
  readOnly?: boolean;
  showCopyButton?: boolean;
}

/**
 * Reusable Monaco Editor component with default configuration
 * Handles Chrome extension CSP compliance and theme management
 */
export function MonacoEditor({
  value,
  onChange,
  language = "text",
  height = "100%",
  options = {},
  readOnly = false,
  showCopyButton = true,
  ...props
}: MonacoEditorProps) {
  const { theme, resolvedTheme } = useTheme();
  const editorPaneActions = useEditorPaneActionContext();
  const actionId = useId();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyResetTimerRef = useRef<number | null>(null);

  // Determine Monaco theme based on app theme
  const monacoTheme =
    resolvedTheme === "dark" || theme === "dark" ? "vs-dark" : "light";

  // Default options optimized for Chrome extension and consistent styling
  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    wordWrap: "on",
    scrollBeyondLastLine: false,
    padding: { top: 8, bottom: 8 },
    fontFamily: "var(--font-mono), 'Courier New', monospace",
    // Disable features that require workers (for Chrome extension CSP compliance)
    quickSuggestions: false,
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: "off",
    tabCompletion: "off",
    wordBasedSuggestions: "off",
    readOnly,
  };

  const handleCopy = useCallback(async () => {
    if (!value.trim()) {
      return;
    }

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      copyResetTimerRef.current = window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("error");
      copyResetTimerRef.current = window.setTimeout(() => setCopyState("idle"), 1200);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showCopyButton || !editorPaneActions) {
      return;
    }

    const copyButton = (
      <button
        type="button"
        onClick={handleCopy}
        disabled={!value}
        className="rounded border border-[var(--content-border)] bg-[var(--content-color)] px-2 py-1 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Copy editor contents"
        title={copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy"}
      >
        {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry" : "Copy"}
      </button>
    );

    editorPaneActions.setAction(actionId, copyButton);

    return () => {
      editorPaneActions.setAction(actionId, null);
    };
  }, [actionId, copyState, editorPaneActions, handleCopy, showCopyButton]);

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      language={language}
      value={value}
      onChange={onChange}
      theme={monacoTheme}
      options={{ ...defaultOptions, ...options }}
      {...props}
    />
  );
}
