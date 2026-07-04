"use client";

import { useEffect, useState } from "react";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { InputCheckbox } from "@/components/InputCheckbox";
import { MonacoEditor } from "@/components/MonacoEditor";
import { Select } from "@/components/Select";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import {
  generateHashOutput,
  HASH_ALGORITHM_OPTIONS,
  HashAlgorithm,
} from "@/lib/hash-generator";
import { SAMPLE_HASH_INPUT } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:hash-generator";

export function HashGenerator() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = usePersistedState<HashAlgorithm>(`${STORAGE_KEY}:algorithm`, "md5");
  const [perLine, setPerLine] = usePersistedState<boolean>(`${STORAGE_KEY}:per-line`, false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    let isCurrent = true;

    const updateHash = async () => {
      try {
        const result = await generateHashOutput(input, algorithm, perLine);
        if (!isCurrent) {
          return;
        }
        setOutput(result);
        setError(null);
      } catch (err) {
        if (!isCurrent) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setOutput("");
        setError(message);
      }
    };

    void updateHash();

    return () => {
      isCurrent = false;
    };
  }, [algorithm, input, perLine]);

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError(null);
  };

  const loadSample = () => {
    setInput(SAMPLE_HASH_INPUT);
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
            <SettingsLabel>Algorithm:</SettingsLabel>
            <Select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}>
              {HASH_ALGORITHM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <InputCheckbox
              label="Per Line"
              checked={perLine}
              onChange={(event) => setPerLine(event.target.checked)}
            />
          </SettingsGroup>

          <ActionButtons onSample={loadSample} onClear={clearAll} />
        </SettingsBar>

        <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane label="Input Text" count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}>
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="text"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label={perLine ? "Line Hashes" : "Hash Output"}
            count={`${outputLineCount} line${outputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              {error ? (
                <div className="flex h-full items-center justify-center rounded-[0.5em] bg-[var(--content-color)] p-4">
                  <div className="text-sm text-red-500">
                    <div className="mb-2 font-semibold">Hash Error:</div>
                    <div className="text-xs">{error}</div>
                  </div>
                </div>
              ) : (
                <MonacoEditor value={output} language="text" readOnly={true} />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>
    </>
  );
}
