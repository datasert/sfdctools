"use client";

import { useState, useEffect, useCallback } from "react";
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
import { jsonToApex } from "@/lib/json-to-apex";
import { SAMPLE_JSON } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:json-to-apex";

export function JsonToApex() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = usePersistedState<number>(`${STORAGE_KEY}:indent`, 4);
  const [rootClassName, setRootClassName] = usePersistedState<string>(`${STORAGE_KEY}:rootClassName`, "Root");
  const [auraEnabled, setAuraEnabled] = usePersistedState<boolean>(`${STORAGE_KEY}:auraEnabled`, false);
  const { showToast, ToastComponent } = useToast();

  // Convert JSON to Apex as user types
  const convertJson = useCallback((json: string, indentSize: number, className: string, aura: boolean) => {
    const result = jsonToApex(json, {
      indentSize,
      rootClassName: className || "Root",
      auraEnabled: aura,
    });
    setOutput(result.apexCode);
    setError(result.error);
  }, []);

  // Auto-convert on input or settings change
  useEffect(() => {
    convertJson(input, indent, rootClassName, auraEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, indent, rootClassName, auraEnabled]);

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
    // Swap doesn't make sense for this tool
  };

  const loadSample = () => {
    setInput(SAMPLE_JSON);
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
            <SettingsLabel>Root Class Name:</SettingsLabel>
            <Input
              type="text"
              value={rootClassName}
              onChange={(e) => {
                const value = e.target.value.trim();
                if (value) {
                  // Ensure it's a valid Apex identifier
                  const validName = value.replace(/[^a-zA-Z0-9_]/g, '_');
                  if (validName && /^[a-zA-Z_]/.test(validName)) {
                    setRootClassName(validName);
                  }
                }
              }}
              className="w-40"
              placeholder="Root"
            />
          </SettingsGroup>

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
          </SettingsGroup>

          <SettingsGroup>
            <InputCheckbox
              checked={auraEnabled}
              onChange={(e) => setAuraEnabled(e.target.checked)}
              label="@AuraEnabled"
            />
          </SettingsGroup>

          <ActionButtons
            onSample={loadSample}
            onCopy={copyOutput}
            onSwap={swapPanes}
            onClear={clearAll}
            copyDisabled={!output || !!error}
            swapDisabled={true}
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
            label="Generated Apex Class"
            count={`${outputLineCount} line${outputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              {error ? (
                <div className="h-full flex items-center justify-center bg-[var(--content-color)] rounded-[0.5em] p-4">
                  <div className="text-sm text-red-500">
                    <div className="font-semibold mb-2">Conversion Error:</div>
                    <div className="text-xs">{error}</div>
                  </div>
                </div>
              ) : (
                <MonacoEditor
                  value={output}
                  language="java"
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
