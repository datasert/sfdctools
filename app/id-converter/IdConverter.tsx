"use client";

import { useState, useEffect } from "react";
import { convertIds } from "@/lib/id-converter";
import { Select } from "@/components/Select";
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
import { ErrorPanel } from "@/components/ErrorPanel";
import { SAMPLE_IDS } from "@/lib/tool-samples";

type ConversionDirection = "to18" | "to15";

const STORAGE_KEY = "sfdc-tools:id-converter";

export function IdConverter() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = usePersistedState<ConversionDirection>(`${STORAGE_KEY}:direction`, "to18");
  const [errors, setErrors] = useState<Array<{ line: number; id: string; error: string }>>([]);
  const { showToast, ToastComponent } = useToast();

  // Auto-convert on input change
  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setErrors([]);
      return;
    }

    try {
      const result = convertIds(input, direction);
      setOutput(result.converted);
      setErrors(result.errors);
      
      if (result.errors.length > 0) {
        showToast(`Conversion completed with ${result.errors.length} error(s)`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(`[ERROR: ${errorMessage}]`);
      setErrors([{ line: 0, id: input, error: errorMessage }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, direction]);

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard!");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setErrors([]);
  };

  const swapPanes = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
  };

  const loadSample = () => {
    setInput(SAMPLE_IDS);
    setErrors([]);
    showToast("Sample input loaded.");
  };

  const inputLineCount = input.split("\n").filter((l) => l.trim()).length;
  const outputLineCount = output.split("\n").filter((l) => l.trim()).length;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <SettingsLabel>Direction:</SettingsLabel>
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value as ConversionDirection)}
              className="min-w-[140px]"
            >
              <option value="to18">15 → 18</option>
              <option value="to15">18 → 15</option>
            </Select>
          </SettingsGroup>

          <ActionButtons
            onSample={loadSample}
            onCopy={copyOutput}
            onSwap={swapPanes}
            onClear={clearAll}
            copyDisabled={!output}
            swapDisabled={!input || !output}
          />

          {errors.length > 0 && (
            <div className="text-xs text-red-500">
              {errors.length} error{errors.length !== 1 ? "s" : ""} found
            </div>
          )}
        </SettingsBar>

        <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane
            label="Input"
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
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
            label="Output"
            count={`${outputLineCount} line${outputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={output}
                language="text"
                readOnly={true}
              />
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>

        <ErrorPanel errors={errors} />
      </div>
    </>
  );
}
