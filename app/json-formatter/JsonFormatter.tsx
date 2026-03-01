"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { JsonCleanupDialog } from "@/components/JsonCleanupDialog";
import {
  cleanupJsonValue,
  defaultJsonCleanupOptions,
  type JsonCleanupOptions,
} from "@/lib/json-cleanup";

const STORAGE_KEY = "sfdc-tools:json-formatter";

function formatJSON(
  json: string,
  indent: number,
  cleanupOptions: JsonCleanupOptions
): { formatted: string; error: string | null } {
  if (!json.trim()) {
    return { formatted: "", error: null };
  }

  try {
    const parsed = JSON.parse(json);
    const cleaned = cleanupJsonValue(parsed, cleanupOptions);
    const formatted = JSON.stringify(cleaned, null, indent);
    return { formatted, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { formatted: "", error: errorMessage };
  }
}

export function JsonFormatter() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = usePersistedState<number>(`${STORAGE_KEY}:indent`, 2);
  const [cleanupOptions, setCleanupOptions] = usePersistedState<JsonCleanupOptions>(
    `${STORAGE_KEY}:cleanup-options`,
    defaultJsonCleanupOptions
  );
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Format JSON as user types
  const formatJson = useCallback((json: string, indentSize: number, options: JsonCleanupOptions) => {
    const result = formatJSON(json, indentSize, options);
    setOutput(result.formatted);
    setError(result.error);
  }, []);

  // Auto-format on input or settings change
  useEffect(() => {
    formatJson(input, indent, cleanupOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, indent, cleanupOptions]);

  const copyOutput = () => {
    if (output && !error) {
      navigator.clipboard.writeText(output);
      showToast("Copied to clipboard!");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const swapPanes = () => {
    if (output && !error) {
      setInput(output);
      setOutput("");
    }
  };

  const inputLineCount = input.split("\n").length;
  const outputLineCount = output.split("\n").length;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <SettingsLabel>Indentation:</SettingsLabel>
            <Input
              type="number"
              value={indent}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 0 && value <= 10) {
                  setIndent(value);
                }
              }}
              className="w-20"
              min="0"
              max="10"
            />
            <SettingsLabel className="text-xs">spaces</SettingsLabel>
            <button
              onClick={() => setIsCleanupDialogOpen(true)}
              className="px-2.5 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
            >
              JSON Cleanup
            </button>
          </SettingsGroup>

          <ActionButtons
            onCopy={copyOutput}
            onSwap={swapPanes}
            onClear={clearAll}
            copyDisabled={!output || !!error}
            swapDisabled={!output || !!error}
          />
        </SettingsBar>

        <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane
            label="Input JSON"
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="json"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label="Formatted JSON"
            count={`${outputLineCount} line${outputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              {error ? (
                <div className="h-full flex items-center justify-center bg-[var(--content-color)] rounded-[0.5em] p-4">
                  <div className="text-sm text-red-500">
                    <div className="font-semibold mb-2">Formatting Error:</div>
                    <div className="text-xs">{error}</div>
                  </div>
                </div>
              ) : (
                <MonacoEditor
                  value={output}
                  language="json"
                  readOnly={true}
                />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>

      <JsonCleanupDialog
        isOpen={isCleanupDialogOpen}
        onClose={() => setIsCleanupDialogOpen(false)}
        options={cleanupOptions}
        onChange={setCleanupOptions}
      />
    </>
  );
}
