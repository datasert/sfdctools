"use client";

import { useState, useEffect, useCallback } from "react";
import { formatSfsql } from "@datasert/langium-sfsql/dist/language/sfsql-formatter-prettier.js";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { Checkbox } from "@/components/Checkbox";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { SAMPLE_SOQL } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:soql-formatter";

export function SoqlFormatter() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [printWidth, setPrintWidth] = usePersistedState<number>(`${STORAGE_KEY}:printWidth`, 150);
  const [uppercase, setUppercase] = usePersistedState<boolean>(`${STORAGE_KEY}:uppercase`, true);
  const [fieldsInNewLine, setFieldsInNewLine] = usePersistedState<boolean>(`${STORAGE_KEY}:fieldsInNewLine`, false);
  const [childQueriesInNewLine, setChildQueriesInNewLine] = usePersistedState<boolean>(`${STORAGE_KEY}:childQueriesInNewLine`, false);
  const [clauseInNewLine, setClauseInNewLine] = usePersistedState<boolean>(`${STORAGE_KEY}:clauseInNewLine`, false);
  const [whereConditionInNewLine, setWhereConditionInNewLine] = usePersistedState<boolean>(`${STORAGE_KEY}:whereConditionInNewLine`, false);
  const { showToast, ToastComponent } = useToast();

  // Format SOQL as user types
  const formatSoql = useCallback(async (
    soql: string,
    width: number,
    upper: boolean,
    fieldsNewLine: boolean,
    childQueriesNewLine: boolean,
    clauseNewLine: boolean,
    whereConditionNewLine: boolean
  ) => {
    if (!soql.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      const formatted = await formatSfsql(soql, {
        printWidth: width,
        uppercase: upper,
        fieldsInNewLine: fieldsNewLine,
        childQueriesInNewLine: childQueriesNewLine,
        clauseInNewLine: clauseNewLine,
        whereConditionInNewLine: whereConditionNewLine,
      });
      setOutput(formatted);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setOutput("");
    }
  }, []);

  // Auto-format on input or settings change
  useEffect(() => {
    formatSoql(input, printWidth, uppercase, fieldsInNewLine, childQueriesInNewLine, clauseInNewLine, whereConditionInNewLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, printWidth, uppercase, fieldsInNewLine, childQueriesInNewLine, clauseInNewLine, whereConditionInNewLine]);

  const copyOutput = () => {
    if (output) {
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
    setInput(SAMPLE_SOQL);
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
              value={printWidth}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                  setPrintWidth(value);
                }
              }}
              className="w-20"
              min="1"
            />
          </SettingsGroup>

          <SettingsGroup>
            <Checkbox
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              label="Keywords Uppercase"
            />
          </SettingsGroup>

          <SettingsGroup>
            <Checkbox
              checked={fieldsInNewLine}
              onChange={(e) => setFieldsInNewLine(e.target.checked)}
              label="Select Field in New Line"
            />
          </SettingsGroup>

          <SettingsGroup>
            <Checkbox
              checked={childQueriesInNewLine}
              onChange={(e) => setChildQueriesInNewLine(e.target.checked)}
              label="Child Query in New Line"
            />
          </SettingsGroup>

          <SettingsGroup>
            <Checkbox
              checked={clauseInNewLine}
              onChange={(e) => setClauseInNewLine(e.target.checked)}
              label="Clause in New Line"
            />
          </SettingsGroup>

          <SettingsGroup>
            <Checkbox
              checked={whereConditionInNewLine}
              onChange={(e) => setWhereConditionInNewLine(e.target.checked)}
              label="Where Condition in New Line"
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
        </SettingsBar>

        <EditorGrid layout="vertical" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane
            label="Input SOQL"
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="sql"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label="Formatted SOQL"
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
                  language="sql"
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
