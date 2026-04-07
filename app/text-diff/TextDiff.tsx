"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { ActionButtons } from "@/components/ActionButtons";
import { Select } from "@/components/Select";
import { EnhancedDiffEditor } from "@/components/EnhancedDiffEditor";
import { TextCleanupDialog } from "@/components/TextCleanupDialog";
import { Button } from "@/components/Button";
import type { DiffOnMount } from "@monaco-editor/react";
import { SAMPLE_TEXT_DIFF_LEFT, SAMPLE_TEXT_DIFF_RIGHT } from "@/lib/tool-samples";
import {
  cleanupText,
  defaultTextCleanupOptions,
  type TextCleanupOptions,
} from "@/lib/text-cleanup";

const STORAGE_KEY = "sfdc-tools:text-diff";
const DEFAULT_LEFT_LABEL = "Left";
const DEFAULT_RIGHT_LABEL = "Right";
const DEFAULT_SYNTAX = "plaintext";

type SyntaxOption = {
  value: string;
  label: string;
  monacoLanguage: string;
};

const SYNTAX_OPTIONS: SyntaxOption[] = [
  { value: "plaintext", label: "Plain Text", monacoLanguage: "plaintext" },
  { value: "json", label: "JSON", monacoLanguage: "json" },
  { value: "xml", label: "XML", monacoLanguage: "xml" },
  { value: "html", label: "HTML", monacoLanguage: "html" },
  { value: "apex", label: "Apex Class", monacoLanguage: "java" },
  { value: "java", label: "Java", monacoLanguage: "java" },
  { value: "javascript", label: "JavaScript", monacoLanguage: "javascript" },
];

function getMonacoLanguage(syntax: string): string {
  return SYNTAX_OPTIONS.find((option) => option.value === syntax)?.monacoLanguage ?? DEFAULT_SYNTAX;
}

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
  const [original, setOriginal] = usePersistedTextState(`${STORAGE_KEY}:original`, "");
  const [modified, setModified] = usePersistedTextState(`${STORAGE_KEY}:modified`, "");
  const [leftLabel, setLeftLabel] = usePersistedState<string>(
    `${STORAGE_KEY}:left-title`,
    DEFAULT_LEFT_LABEL,
  );
  const [rightLabel, setRightLabel] = usePersistedState<string>(
    `${STORAGE_KEY}:right-title`,
    DEFAULT_RIGHT_LABEL,
  );
  const [syntax, setSyntax] = usePersistedState<string>(
    `${STORAGE_KEY}:syntax`,
    DEFAULT_SYNTAX,
  );
  const [cleanupOptions, setCleanupOptions] = usePersistedState<TextCleanupOptions>(
    `${STORAGE_KEY}:cleanup-options`,
    defaultTextCleanupOptions,
  );
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [hasOriginal, setHasOriginal] = useState(Boolean(original));
  const [hasModified, setHasModified] = useState(Boolean(modified));
  const originalRef = useRef(original);
  const modifiedRef = useRef(modified);
  const cleanedOriginalRef = useRef(original);
  const cleanedModifiedRef = useRef(modified);
  const ignoreOriginalCleanupSyncRef = useRef(false);
  const ignoreModifiedCleanupSyncRef = useRef(false);
  const { showToast, ToastComponent } = useToast();

  const cleanedOriginal = useMemo(
    () => cleanupText(original, cleanupOptions),
    [cleanupOptions, original],
  );
  const cleanedModified = useMemo(
    () => cleanupText(modified, cleanupOptions),
    [cleanupOptions, modified],
  );

  useEffect(() => {
    originalRef.current = original;
    modifiedRef.current = modified;
  }, [original, modified]);

  useEffect(() => {
    cleanedOriginalRef.current = cleanedOriginal;
    if (cleanedOriginal !== originalRef.current) {
      ignoreOriginalCleanupSyncRef.current = true;
    }
  }, [cleanedOriginal]);

  useEffect(() => {
    cleanedModifiedRef.current = cleanedModified;
    if (cleanedModified !== modifiedRef.current) {
      ignoreModifiedCleanupSyncRef.current = true;
    }
  }, [cleanedModified]);

  const handleEditorMount: DiffOnMount = (editor) => {
    // Set up change listeners for editable diff editor
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();
    
    originalEditor.onDidChangeModelContent(() => {
      const value = originalEditor.getValue();
      if (
        ignoreOriginalCleanupSyncRef.current &&
        value === cleanedOriginalRef.current
      ) {
        ignoreOriginalCleanupSyncRef.current = false;
        return;
      }

      ignoreOriginalCleanupSyncRef.current = false;
      originalRef.current = value;
      setHasOriginal(Boolean(value));
      setOriginal(value);
    });
    
    modifiedEditor.onDidChangeModelContent(() => {
      const value = modifiedEditor.getValue();
      if (
        ignoreModifiedCleanupSyncRef.current &&
        value === cleanedModifiedRef.current
      ) {
        ignoreModifiedCleanupSyncRef.current = false;
        return;
      }

      ignoreModifiedCleanupSyncRef.current = false;
      modifiedRef.current = value;
      setHasModified(Boolean(value));
      setModified(value);
    });
  };

  const copyDiffs = async () => {
    const missingInLeft = getMissingLines(cleanedModified, cleanedOriginal);
    const missingInRight = getMissingLines(cleanedOriginal, cleanedModified);

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
    setCleanupOptions(defaultTextCleanupOptions);
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
  };

  const loadSample = () => {
    originalRef.current = SAMPLE_TEXT_DIFF_LEFT;
    modifiedRef.current = SAMPLE_TEXT_DIFF_RIGHT;
    setHasOriginal(true);
    setHasModified(true);
    setOriginal(SAMPLE_TEXT_DIFF_LEFT);
    setModified(SAMPLE_TEXT_DIFF_RIGHT);
    showToast("Sample input loaded.", "info");
  };

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <SettingsLabel>Syntax:</SettingsLabel>
            <Select
              value={syntax}
              onChange={(event) => setSyntax(event.target.value)}
              className="min-w-[150px]"
              aria-label="Text diff syntax"
            >
              {SYNTAX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button
              onClick={() => setIsCleanupDialogOpen(true)}
              variant="secondary"
              size="sm"
            >
              Text Cleanup
            </Button>
          </SettingsGroup>

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
            key={JSON.stringify(cleanupOptions)}
            height="100%"
            language={getMonacoLanguage(syntax)}
            original={cleanedOriginal}
            modified={cleanedModified}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
            defaultLeftLabel={DEFAULT_LEFT_LABEL}
            defaultRightLabel={DEFAULT_RIGHT_LABEL}
            onLeftLabelChange={setLeftLabel}
            onRightLabelChange={setRightLabel}
            autoCollapseOnContentChange={true}
            readOnly={false}
            onMount={handleEditorMount}
          />
        </div>
      </div>

      <TextCleanupDialog
        isOpen={isCleanupDialogOpen}
        onClose={() => setIsCleanupDialogOpen(false)}
        options={cleanupOptions}
        onChange={setCleanupOptions}
      />
    </>
  );
}
