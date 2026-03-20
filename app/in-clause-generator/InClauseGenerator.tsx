"use client";

import { useState, useEffect, useCallback } from "react";
import { generateInClause, InClauseOptions } from "@/lib/in-clause-generator";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
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
import { SAMPLE_IN_CLAUSE_VALUES } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:in-clause-generator";

export function InClauseGenerator() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dedupe, setDedupe] = usePersistedState<boolean>(`${STORAGE_KEY}:dedupe`, true);
  const [sorted, setSorted] = usePersistedState<boolean>(`${STORAGE_KEY}:sorted`, false);
  const [maxValuesPerLine, setMaxValuesPerLine] = usePersistedState<number>(`${STORAGE_KEY}:maxValuesPerLine`, 5);
  const [quoted, setQuoted] = usePersistedState<boolean>(`${STORAGE_KEY}:quoted`, true);
  const [splitAfter, setSplitAfter] = usePersistedState<number | undefined>(`${STORAGE_KEY}:splitAfter`, undefined);
  const { showToast, ToastComponent } = useToast();

  // Generate IN clause as user types
  const generateInClauseOutput = useCallback((formula: string, options: InClauseOptions) => {
    if (!formula.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const result = generateInClause(formula, options);
    setOutput(result.output);
    setError(result.error);
  }, []);

  // Auto-generate on input or settings change
  useEffect(() => {
    generateInClauseOutput(input, {
      dedupe,
      sorted,
      maxValuesPerLine,
      quoted,
      splitAfter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, dedupe, sorted, maxValuesPerLine, quoted, splitAfter]);

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
    setInput(SAMPLE_IN_CLAUSE_VALUES);
    setError(null);
    showToast("Sample input loaded.");
  };

  const inputValueCount = input.split(/[,\n]/).filter((v) => v.trim()).length;
  const outputLineCount = output.split("\n").length;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <InputCheckbox
              checked={dedupe}
              onChange={(e) => setDedupe(e.target.checked)}
              label="Dedupe"
            />
          </SettingsGroup>

          <SettingsGroup>
            <InputCheckbox
              checked={sorted}
              onChange={(e) => setSorted(e.target.checked)}
              label="Sorted"
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsLabel>Max Values per Line:</SettingsLabel>
            <Input
              type="number"
              value={maxValuesPerLine}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  setMaxValuesPerLine(value);
                }
              }}
              className="w-20"
              min="1"
            />
          </SettingsGroup>

          <SettingsGroup>
            <InputCheckbox
              checked={quoted}
              onChange={(e) => setQuoted(e.target.checked)}
              label="Quoted"
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsLabel>Split After:</SettingsLabel>
            <Input
              type="number"
              value={splitAfter || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                if (value === undefined || (!isNaN(value) && value > 0)) {
                  setSplitAfter(value);
                }
              }}
              placeholder="None"
              className="w-24"
              min="1"
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

        <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane
            label="Input Values"
            count={`${inputValueCount} value${inputValueCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="text"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label="IN Clause Output"
            count={`${outputLineCount} line${outputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              {error ? (
                <div className="h-full flex items-center justify-center bg-[var(--content-color)] rounded-[0.5em] p-4">
                  <div className="text-sm text-red-500">
                    <div className="font-semibold mb-2">Generation Error:</div>
                    <div className="text-xs">{error}</div>
                  </div>
                </div>
              ) : (
                <MonacoEditor
                  value={output}
                  onChange={(value) => {
                    setOutput(value || "");
                    setError(null);
                  }}
                  language="sql"
                />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>
    </>
  );
}
