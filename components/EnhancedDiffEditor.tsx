"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { DiffEditor } from "@monaco-editor/react";
import type { DiffOnMount } from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";
import { Checkbox } from "./Checkbox";
import { useToast } from "./Toast";
import { EditableLabel } from "./EditableLabel";

interface EnhancedDiffEditorProps {
  original: string;
  modified: string;
  leftLabel?: string;
  rightLabel?: string;
  defaultLeftLabel?: string;
  defaultRightLabel?: string;
  onLeftLabelChange?: (value: string) => void;
  onRightLabelChange?: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  showEditableLabels?: boolean;
  className?: string;
  options?: MonacoType.editor.IDiffEditorConstructionOptions;
  onMount?: DiffOnMount;
}

export function EnhancedDiffEditor({
  original,
  modified,
  leftLabel,
  rightLabel,
  defaultLeftLabel = "Left",
  defaultRightLabel = "Right",
  onLeftLabelChange,
  onRightLabelChange,
  language = "plaintext",
  height = "100%",
  readOnly = true,
  showToolbar = true,
  showEditableLabels = true,
  className = "",
  options = {},
  onMount,
}: EnhancedDiffEditorProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { showToast, ToastComponent } = useToast();
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
  const [wrapText, setWrapText] = useState(true);
  const [collapseUnchanged, setCollapseUnchanged] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [localLeftLabel, setLocalLeftLabel] = useState(defaultLeftLabel);
  const [localRightLabel, setLocalRightLabel] = useState(defaultRightLabel);
  const diffEditorRef = useRef<MonacoType.editor.IStandaloneDiffEditor | null>(
    null,
  );
  const diffListenerRef = useRef<MonacoType.IDisposable | null>(null);
  const rafRef = useRef<number | null>(null);
  const modelIdRef = useRef<string>(
    `diff-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    const editor = diffEditorRef.current;
    if (!editor) return;

    const wrapMode = wrapText ? "on" : "off";
    editor.updateOptions({
      ignoreTrimWhitespace: ignoreWhitespace,
      diffWordWrap: wrapMode,
      wordWrap: wrapMode,
      hideUnchangedRegions: {
        enabled: collapseUnchanged,
      },
      useInlineViewWhenSpaceIsLimited: false,
    });
    editor.getOriginalEditor().updateOptions({ wordWrap: wrapMode });
    editor.getModifiedEditor().updateOptions({ wordWrap: wrapMode });
  }, [collapseUnchanged, ignoreWhitespace, wrapText]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      diffListenerRef.current?.dispose();
      diffEditorRef.current = null;
    };
  }, []);

  const monacoTheme =
    resolvedTheme === "dark" || theme === "dark" ? "vs-dark" : "light";
  const effectiveOriginal = original;
  const effectiveModified = modified;
  const resolvedLeftLabel = leftLabel ?? localLeftLabel;
  const resolvedRightLabel = rightLabel ?? localRightLabel;

  const handleLeftLabelChange = (value: string) => {
    if (leftLabel === undefined) {
      setLocalLeftLabel(value);
    }
    onLeftLabelChange?.(value);
  };

  const handleRightLabelChange = (value: string) => {
    if (rightLabel === undefined) {
      setLocalRightLabel(value);
    }
    onRightLabelChange?.(value);
  };

  useEffect(() => {
    const editor = diffEditorRef.current;
    if (!editor) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      editor.layout();
    });
    const timeoutId = window.setTimeout(() => {
      editor.layout();
    }, 150);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.clearTimeout(timeoutId);
    };
  }, [effectiveOriginal, effectiveModified, isMaximized, monacoTheme]);

  const handleMount: DiffOnMount = (editor, monaco) => {
    diffEditorRef.current = editor;
    diffListenerRef.current?.dispose();

    const refreshChanges = () => {
      setHasChanges((editor.getLineChanges()?.length ?? 0) > 0);
    };

    diffListenerRef.current = editor.onDidUpdateDiff(refreshChanges);
    refreshChanges();

    const wrapMode = wrapText ? "on" : "off";
    editor.updateOptions({
      ignoreTrimWhitespace: ignoreWhitespace,
      diffWordWrap: wrapMode,
      wordWrap: wrapMode,
      hideUnchangedRegions: {
        enabled: collapseUnchanged,
      },
    });
    editor.getOriginalEditor().updateOptions({ wordWrap: wrapMode });
    editor.getModifiedEditor().updateOptions({ wordWrap: wrapMode });

    onMount?.(editor, monaco);
  };

  const mergedOptions =
    useMemo<MonacoType.editor.IDiffEditorConstructionOptions>(
      () => ({
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        wordWrap: wrapText ? "on" : "off",
        diffWordWrap: wrapText ? "on" : "off",
        ignoreTrimWhitespace: ignoreWhitespace,
        scrollBeyondLastLine: false,
        hideUnchangedRegions: {
          enabled: collapseUnchanged,
        },
        padding: { top: 8, bottom: 8 },
        fontFamily: "var(--font-mono), 'Courier New', monospace",
        readOnly,
        originalEditable: !readOnly,
        renderSideBySide: true,
        enableSplitViewResizing: true,
        useInlineViewWhenSpaceIsLimited: false,
        automaticLayout: true,
        ...options,
      }),
      [collapseUnchanged, ignoreWhitespace, options, readOnly, wrapText],
    );

  return (
    <div
      className={
        isMaximized ? "fixed inset-0 z-50 bg-[var(--background)] p-3" : "h-full"
      }
    >
      <div className={`h-full flex flex-col ${className}`}>
        {ToastComponent}
        {(showEditableLabels || showToolbar) && (
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {showEditableLabels && (
                <EditableLabel
                  value={resolvedLeftLabel}
                  onChange={handleLeftLabelChange}
                  placeholder={defaultLeftLabel}
                  inputClassName="w-[100px]"
                  textClassName="w-auto max-w-none whitespace-nowrap"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              {showEditableLabels && (
                <EditableLabel
                  value={resolvedRightLabel}
                  onChange={handleRightLabelChange}
                  placeholder={defaultRightLabel}
                  inputClassName="w-[100px]"
                  textClassName="w-auto max-w-none whitespace-nowrap"
                />
              )}

              {showToolbar && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(effectiveOriginal);
                      showToast("Left copied.");
                    }}
                    className="px-2.5 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                    title="Copy left"
                    aria-label="Copy left"
                  >
                    Copy Left
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(effectiveModified);
                      showToast("Right copied.");
                    }}
                    className="px-2.5 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                    title="Copy right"
                    aria-label="Copy right"
                  >
                    Copy Right
                  </button>

                  <button
                    onClick={() => diffEditorRef.current?.goToDiff("previous")}
                    disabled={!hasChanges}
                    className="px-2 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Previous difference"
                    aria-label="Previous difference"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M10 4v12M10 4l-4 4M10 4l4 4"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => diffEditorRef.current?.goToDiff("next")}
                    disabled={!hasChanges}
                    className="px-2 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Next difference"
                    aria-label="Next difference"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M10 16V4M10 16l-4-4M10 16l4-4"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setCollapseUnchanged((currentValue) => !currentValue)
                    }
                    className="px-2 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                    title={
                      collapseUnchanged
                        ? "Expand unchanged lines"
                        : "Collapse unchanged lines"
                    }
                    aria-label={
                      collapseUnchanged
                        ? "Expand unchanged lines"
                        : "Collapse unchanged lines"
                    }
                  >
                    {collapseUnchanged ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 8l3-3 3 3M7 12l3 3 3-3"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 10h12"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 5l3 3 3-3M7 15l3-3 3 3"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 10h12"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>

                  <Checkbox
                    label="Ignore Whitespace"
                    checked={ignoreWhitespace}
                    onChange={(event) =>
                      setIgnoreWhitespace(event.target.checked)
                    }
                  />
                  <Checkbox
                    label="Wrap Text"
                    checked={wrapText}
                    onChange={(event) => setWrapText(event.target.checked)}
                  />
                  <button
                    onClick={() => setIsMaximized((value) => !value)}
                    className="px-2 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                    title={isMaximized ? "Exit full page" : "Full page"}
                    aria-label={isMaximized ? "Exit full page" : "Full page"}
                  >
                    {isMaximized ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 3H3v4M13 3h4v4M3 13v4h4M17 13v4h-4"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M8 8h4v4H8z" strokeWidth="1.5" />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 3H3v4M13 3h4v4M3 13v4h4M17 13v4h-4"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M6 6h8v8H6z" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <DiffEditor
          key={`diff-editor-${pathname}`}
          height={height}
          language={language}
          original={effectiveOriginal}
          modified={effectiveModified}
          originalModelPath={`inmemory://${modelIdRef.current}/original.${language}`}
          modifiedModelPath={`inmemory://${modelIdRef.current}/modified.${language}`}
          keepCurrentOriginalModel={true}
          keepCurrentModifiedModel={true}
          theme={monacoTheme}
          onMount={handleMount}
          options={mergedOptions}
        />
      </div>
    </div>
  );
}
