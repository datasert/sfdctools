"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Editor, { EditorProps, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface MonacoEditorProps extends Omit<EditorProps, "theme" | "options"> {
  value: string;
  onChange?: OnChange;
  language?: string;
  height?: string;
  options?: editor.IStandaloneEditorConstructionOptions;
  readOnly?: boolean;
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
  ...props
}: MonacoEditorProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine Monaco theme based on app theme
  const monacoTheme = mounted && (resolvedTheme === "dark" || theme === "dark") ? "vs-dark" : "light";

  // Default options optimized for Chrome extension and consistent styling
  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 13,
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
