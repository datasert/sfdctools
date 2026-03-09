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

export function TextDiff() {
  const [original, setOriginal] = usePersistedState<string>(`${STORAGE_KEY}:original`, "");
  const [modified, setModified] = usePersistedState<string>(`${STORAGE_KEY}:modified`, "");
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

  const copyModified = () => {
    if (modifiedRef.current) {
      navigator.clipboard.writeText(modifiedRef.current);
      showToast("Modified text copied to clipboard!");
    }
  };

  const clearAll = () => {
    originalRef.current = "";
    modifiedRef.current = "";
    setHasOriginal(false);
    setHasModified(false);
    setOriginal("");
    setModified("");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}:original`, JSON.stringify(""));
      window.localStorage.setItem(`${STORAGE_KEY}:modified`, JSON.stringify(""));
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
    showToast("Sample input loaded.");
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
            <ActionButtons
              onSample={loadSample}
              onCopy={copyModified}
              onSwap={swapTexts}
              onClear={clearAll}
              copyDisabled={!hasModified}
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
            readOnly={false}
            onMount={handleEditorMount}
          />
        </div>
      </div>
    </>
  );
}
