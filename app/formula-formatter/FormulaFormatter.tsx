"use client";

import { useState, useEffect, useCallback } from "react";
import { formatFormula } from "@/lib/formula-formatter";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { InputCheckbox } from "@/components/InputCheckbox";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { SAMPLE_FORMULA } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:formula-formatter";

export function FormulaFormatter() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lineWidth, setLineWidth] = usePersistedState<number>(`${STORAGE_KEY}:lineWidth`, 150);
  const [uppercase, setUppercase] = usePersistedState<boolean>(`${STORAGE_KEY}:uppercase`, true);
  const { showToast, ToastComponent } = useToast();

  // Format formula as user types
  const formatFormulaInput = useCallback((formula: string, width: number, upper: boolean) => {
    if (!formula.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const result = formatFormula(formula, {
      lineWidth: width,
      uppercase: upper,
    });
    
    setOutput(result.formatted);
    setError(result.error);
  }, []);

  // Auto-format on input or settings change
  useEffect(() => {
    formatFormulaInput(input, lineWidth, uppercase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, lineWidth, uppercase]);

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

  const loadSample = () => {
    setInput(SAMPLE_FORMULA);
    setError(null);
    showToast("Sample input loaded.");
  };

  const inputLineCount = input.split("\n").length;
  const outputLineCount = output.split("\n").length;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <SettingsLabel>Line Width:</SettingsLabel>
            <Input
              type="number"
              value={lineWidth}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  setLineWidth(value);
                }
              }}
              className="w-20"
              min="1"
            />
          </SettingsGroup>

          <SettingsGroup>
            <InputCheckbox
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              label="Keywords Uppercase"
            />
          </SettingsGroup>

          <ActionButtons
            onSample={loadSample}
            onCopy={copyOutput}
            onSwap={swapPanes}
            onClear={clearAll}
            copyDisabled={!output || !!error}
            swapDisabled={!output || !!error}
          />

          {error && <ErrorDisplay error={error} className="flex-1 min-w-full" />}
        </SettingsBar>

        <EditorGrid layout="vertical" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane
            label="Input Formula"
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="javascript"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label="Formatted Formula"
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
                  language="javascript"
                  readOnly={true}
                />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>
    </>
  );
}
