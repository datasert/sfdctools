"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { XmlCleanupDialog } from "@/components/XmlCleanupDialog";
import { SAMPLE_XML } from "@/lib/tool-samples";
import {
  defaultXmlCleanupOptions,
  formatXmlWithCleanup,
  type XmlCleanupOptions,
} from "@/lib/xml-cleanup";

const STORAGE_KEY = "sfdc-tools:xml-formatter";

export function XmlFormatter() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = usePersistedState<number>(`${STORAGE_KEY}:indent`, 2);
  const [cleanupOptions, setCleanupOptions] =
    usePersistedState<XmlCleanupOptions>(
      `${STORAGE_KEY}:cleanup-options`,
      defaultXmlCleanupOptions,
    );
  const normalizedCleanupOptions = useMemo(
    () => ({
      ...defaultXmlCleanupOptions,
      ...cleanupOptions,
    }),
    [cleanupOptions],
  );
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Format XML as user types
  const formatXml = useCallback((
    xml: string,
    indentSize: number,
    options: XmlCleanupOptions,
  ) => {
    const result = formatXmlWithCleanup(xml, indentSize, options);
    setOutput(result.formatted);
    setError(result.error);
  }, []);

  // Auto-format on input or settings change
  useEffect(() => {
    formatXml(input, indent, normalizedCleanupOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, indent, normalizedCleanupOptions]);

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
    setInput(SAMPLE_XML);
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
            <button
              onClick={() => setIsCleanupDialogOpen(true)}
              className="cursor-pointer rounded border border-[var(--content-border)] bg-[var(--content-color)] px-2.5 py-1 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
            >
              XML Cleanup
            </button>
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
            label="Input XML"
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="xml"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label="Formatted XML"
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
                  language="xml"
                  readOnly={true}
                />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>

      <XmlCleanupDialog
        isOpen={isCleanupDialogOpen}
        onClose={() => setIsCleanupDialogOpen(false)}
        options={normalizedCleanupOptions}
        onChange={setCleanupOptions}
      />
    </>
  );
}
