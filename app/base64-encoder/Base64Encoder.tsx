"use client";

import { useState, useEffect, useCallback } from "react";
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
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { SAMPLE_BASE64_ENCODED, SAMPLE_BASE64_TEXT } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:base64-encoder";

function encodeBase64(text: string): { encoded: string; error: string | null } {
  if (!text.trim()) {
    return { encoded: "", error: null };
  }

  try {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return { encoded, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { encoded: "", error: errorMessage };
  }
}

function decodeBase64(base64: string): { decoded: string; error: string | null } {
  if (!base64.trim()) {
    return { decoded: "", error: null };
  }

  try {
    // Remove whitespace
    const cleaned = base64.replace(/\s/g, "");
    const decoded = decodeURIComponent(escape(atob(cleaned)));
    return { decoded, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { decoded: "", error: errorMessage };
  }
}

export function Base64Encoder() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = usePersistedState<"encode" | "decode">(`${STORAGE_KEY}:mode`, "decode");
  const { showToast, ToastComponent } = useToast();

  // Convert as user types
  const convert = useCallback((text: string, convertMode: "encode" | "decode") => {
    if (convertMode === "encode") {
      const result = encodeBase64(text);
      setOutput(result.encoded);
      setError(result.error);
    } else {
      const result = decodeBase64(text);
      setOutput(result.decoded);
      setError(result.error);
    }
  }, []);

  // Auto-convert on input or mode change
  useEffect(() => {
    convert(input, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode]);

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
      // Toggle mode when swapping
      setMode(mode === "encode" ? "decode" : "encode");
    }
  };

  const loadSample = () => {
    setInput(mode === "encode" ? SAMPLE_BASE64_TEXT : SAMPLE_BASE64_ENCODED);
    setError(null);
    showToast("Sample input loaded.");
  };

  const inputLineCount = input.split("\n").length;
  const outputLineCount = output.split("\n").length;

  const inputLabel = mode === "encode" ? "Input Text" : "Input Base64";
  const outputLabel = mode === "encode" ? "Encoded Base64" : "Decoded Text";

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <SettingsLabel>Mode:</SettingsLabel>
            <SegmentedToggle
              value={mode}
              onChange={setMode}
              options={[
                { label: "Encode", value: "encode" },
                { label: "Decode", value: "decode" },
              ]}
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

        <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane
            label={inputLabel}
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language={mode === "encode" ? "text" : "text"}
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label={outputLabel}
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
                  language={mode === "encode" ? "text" : "text"}
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
