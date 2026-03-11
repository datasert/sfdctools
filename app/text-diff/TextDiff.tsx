"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { SettingsBar } from "@/components/SettingsBar";
import { ActionButtons } from "@/components/ActionButtons";
import { EnhancedDiffEditor } from "@/components/EnhancedDiffEditor";
import { Button } from "@/components/Button";
import type { DiffOnMount } from "@monaco-editor/react";
import { SAMPLE_TEXT_DIFF_LEFT, SAMPLE_TEXT_DIFF_RIGHT } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:text-diff";
const DEFAULT_LEFT_LABEL = "Left";
const DEFAULT_RIGHT_LABEL = "Right";

function sortTextLines(value: string): string {
  if (!value) return value;

  const hasTrailingNewline = value.endsWith("\n");
  const lines = value.split("\n");
  if (hasTrailingNewline) {
    lines.pop();
  }

  const sorted = lines.sort((left, right) => left.localeCompare(right));
  const result = sorted.join("\n");
  return hasTrailingNewline ? `${result}\n` : result;
}

function getTextLines(value: string): string[] {
  if (!value) {
    return [];
  }

  const lines = value.split("\n");
  if (value.endsWith("\n")) {
    lines.pop();
  }

  return lines;
}

function getMissingLines(source: string, comparison: string): string[] {
  const sourceLines = getTextLines(source);
  const comparisonCounts = new Map<string, number>();

  for (const line of getTextLines(comparison)) {
    comparisonCounts.set(line, (comparisonCounts.get(line) ?? 0) + 1);
  }

  const missingLines: string[] = [];

  for (const line of sourceLines) {
    const remainingCount = comparisonCounts.get(line) ?? 0;
    if (remainingCount > 0) {
      comparisonCounts.set(line, remainingCount - 1);
      continue;
    }
    missingLines.push(line);
  }

  return missingLines;
}

export function TextDiff() {
  const [original, setOriginal] = usePersistedState<string>(`${STORAGE_KEY}:original`, "");
  const [modified, setModified] = usePersistedState<string>(`${STORAGE_KEY}:modified`, "");
  const [leftLabel, setLeftLabel] = usePersistedState<string>(
    `${STORAGE_KEY}:left-title`,
    DEFAULT_LEFT_LABEL,
  );
  const [rightLabel, setRightLabel] = usePersistedState<string>(
    `${STORAGE_KEY}:right-title`,
    DEFAULT_RIGHT_LABEL,
  );
  const [hasOriginal, setHasOriginal] = useState(Boolean(original));
  const [hasModified, setHasModified] = useState(Boolean(modified));
  const originalRef = useRef(original);
  const modifiedRef = useRef(modified);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    originalRef.current = original;
    modifiedRef.current = modified;
  }, [original, modified]);

  const handleEditorMount: DiffOnMount = (editor) => {
    // Set up change listeners for editable diff editor
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();
    
    originalEditor.onDidChangeModelContent(() => {
      const value = originalEditor.getValue();
      originalRef.current = value;
      setHasOriginal(Boolean(value));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${STORAGE_KEY}:original`, JSON.stringify(value));
      }
    });
    
    modifiedEditor.onDidChangeModelContent(() => {
      const value = modifiedEditor.getValue();
      modifiedRef.current = value;
      setHasModified(Boolean(value));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${STORAGE_KEY}:modified`, JSON.stringify(value));
      }
    });
  };

  const copyDiffs = async () => {
    const missingInLeft = getMissingLines(modifiedRef.current, originalRef.current);
    const missingInRight = getMissingLines(originalRef.current, modifiedRef.current);

    if (missingInLeft.length === 0 && missingInRight.length === 0) {
      showToast("No diff lines to copy.", "warn");
      return;
    }

    const payload = [
      `Missing in Left [${DEFAULT_LEFT_LABEL}]:`,
      ...(missingInLeft.length > 0 ? missingInLeft : ["(none)"]),
      "",
      `Missing in Right [${DEFAULT_RIGHT_LABEL}]:`,
      ...(missingInRight.length > 0 ? missingInRight : ["(none)"]),
    ].join("\n");

    await navigator.clipboard.writeText(payload);
    showToast("Diff lines copied to clipboard!", "success");
  };

  const clearAll = () => {
    originalRef.current = "";
    modifiedRef.current = "";
    setHasOriginal(false);
    setHasModified(false);
    setOriginal("");
    setModified("");
    setLeftLabel(DEFAULT_LEFT_LABEL);
    setRightLabel(DEFAULT_RIGHT_LABEL);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}:original`, JSON.stringify(""));
      window.localStorage.setItem(`${STORAGE_KEY}:modified`, JSON.stringify(""));
      window.localStorage.setItem(`${STORAGE_KEY}:left-title`, JSON.stringify(DEFAULT_LEFT_LABEL));
      window.localStorage.setItem(`${STORAGE_KEY}:right-title`, JSON.stringify(DEFAULT_RIGHT_LABEL));
    }
  };

  const swapTexts = () => {
    const nextOriginal = modifiedRef.current;
    const nextModified = originalRef.current;
    originalRef.current = nextOriginal;
    modifiedRef.current = nextModified;
    setHasOriginal(Boolean(nextOriginal));
    setHasModified(Boolean(nextModified));
    setOriginal(nextOriginal);
    setModified(nextModified);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}:original`, JSON.stringify(nextOriginal));
      window.localStorage.setItem(`${STORAGE_KEY}:modified`, JSON.stringify(nextModified));
    }
  };

  const sortTexts = () => {
    const nextOriginal = sortTextLines(originalRef.current);
    const nextModified = sortTextLines(modifiedRef.current);
    originalRef.current = nextOriginal;
    modifiedRef.current = nextModified;
    setHasOriginal(Boolean(nextOriginal));
    setHasModified(Boolean(nextModified));
    setOriginal(nextOriginal);
    setModified(nextModified);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}:original`, JSON.stringify(nextOriginal));
      window.localStorage.setItem(`${STORAGE_KEY}:modified`, JSON.stringify(nextModified));
    }
  };

  const loadSample = () => {
    originalRef.current = SAMPLE_TEXT_DIFF_LEFT;
    modifiedRef.current = SAMPLE_TEXT_DIFF_RIGHT;
    setHasOriginal(true);
    setHasModified(true);
    setOriginal(SAMPLE_TEXT_DIFF_LEFT);
    setModified(SAMPLE_TEXT_DIFF_RIGHT);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}:original`, JSON.stringify(SAMPLE_TEXT_DIFF_LEFT));
      window.localStorage.setItem(`${STORAGE_KEY}:modified`, JSON.stringify(SAMPLE_TEXT_DIFF_RIGHT));
    }
    showToast("Sample input loaded.", "info");
  };

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={sortTexts}
              variant="secondary"
              size="sm"
              disabled={!hasOriginal && !hasModified}
            >
              Sort Text
            </Button>
            <Button
              onClick={copyDiffs}
              variant="secondary"
              size="sm"
              disabled={!hasOriginal && !hasModified}
            >
              Copy Diffs
            </Button>
            <ActionButtons
              onSample={loadSample}
              onSwap={swapTexts}
              onClear={clearAll}
              swapDisabled={!hasOriginal && !hasModified}
              className="ml-0"
            />
          </div>
        </SettingsBar>

        {/* Editable Diff Editor */}
        <div className="flex-1 p-3">
          <EnhancedDiffEditor
            height="100%"
            language="plaintext"
            original={original}
            modified={modified}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            defaultLeftLabel={DEFAULT_LEFT_LABEL}
            defaultRightLabel={DEFAULT_RIGHT_LABEL}
            onLeftLabelChange={setLeftLabel}
            onRightLabelChange={setRightLabel}
            readOnly={false}
            onMount={handleEditorMount}
          />
        </div>
      </div>
    </>
  );
}
