"use client";

import { useMemo, useState } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useToast } from "@/components/Toast";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { ActionButtons } from "@/components/ActionButtons";
import { MonacoEditor } from "@/components/MonacoEditor";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { EnhancedDiffEditor } from "@/components/EnhancedDiffEditor";
import { Splitter } from "@/components/Splitter";
import { JsonCleanupDialog } from "@/components/JsonCleanupDialog";
import {
  cleanupJsonValue,
  defaultJsonCleanupOptions,
  type JsonCleanupOptions,
} from "@/lib/json-cleanup";

const STORAGE_KEY = "sfdc-tools:json-diff";

function formatJsonWithCleanup(
  input: string,
  indent: number,
  options: JsonCleanupOptions,
): { formatted: string; error: string | null } {
  if (!input.trim()) {
    return { formatted: "", error: null };
  }

  try {
    const parsed = JSON.parse(input);
    const cleaned = cleanupJsonValue(parsed, options);
    return { formatted: JSON.stringify(cleaned, null, indent), error: null };
  } catch (error) {
    return {
      formatted: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function JsonDiff() {
  const [leftJson, setLeftJson] = usePersistedState<string>(
    `${STORAGE_KEY}:left`,
    "",
  );
  const [rightJson, setRightJson] = usePersistedState<string>(
    `${STORAGE_KEY}:right`,
    "",
  );
  const [leftTitle, setLeftTitle] = usePersistedState<string>(
    `${STORAGE_KEY}:left-title`,
    "Left",
  );
  const [rightTitle, setRightTitle] = usePersistedState<string>(
    `${STORAGE_KEY}:right-title`,
    "Right",
  );
  const [indent, setIndent] = usePersistedState<number>(
    `${STORAGE_KEY}:indent`,
    2,
  );
  const [cleanupOptions, setCleanupOptions] =
    usePersistedState<JsonCleanupOptions>(
      `${STORAGE_KEY}:cleanup-options`,
      defaultJsonCleanupOptions,
    );
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const leftResult = useMemo(
    () => formatJsonWithCleanup(leftJson, indent, cleanupOptions),
    [leftJson, indent, cleanupOptions],
  );
  const rightResult = useMemo(
    () => formatJsonWithCleanup(rightJson, indent, cleanupOptions),
    [rightJson, indent, cleanupOptions],
  );

  const copyCleanedRight = () => {
    if (rightResult.formatted && !rightResult.error) {
      navigator.clipboard.writeText(rightResult.formatted);
      showToast("Cleaned right JSON copied.");
    }
  };

  const clearAll = () => {
    setLeftJson("");
    setRightJson("");
  };

  const swapSides = () => {
    const prevLeft = leftJson;
    setLeftJson(rightJson);
    setRightJson(prevLeft);
  };

  const leftLineCount = leftJson ? leftJson.split("\n").length : 0;
  const rightLineCount = rightJson ? rightJson.split("\n").length : 0;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <button
              onClick={() => setIsCleanupDialogOpen(true)}
              className="px-2.5 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
            >
              JSON Cleanup
            </button>
            <label className="text-xs text-[var(--text-secondary)]">
              Indent
            </label>
            <input
              type="number"
              value={indent}
              onChange={(event) => {
                const value = parseInt(event.target.value, 10);
                if (!isNaN(value) && value >= 0 && value <= 10) {
                  setIndent(value);
                }
              }}
              className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
              min="0"
              max="10"
            />
          </SettingsGroup>

          <ActionButtons
            onCopy={copyCleanedRight}
            onSwap={swapSides}
            onClear={clearAll}
            copyDisabled={!rightResult.formatted || !!rightResult.error}
            swapDisabled={!leftJson && !rightJson}
          />
        </SettingsBar>

        <Splitter
          orientation="vertical"
          storageKey={`${STORAGE_KEY}:main-split`}
          defaultSize={30}
          minSize={15}
          maxSize={70}
          className="p-3"
        >
          <div className="h-full overflow-hidden">
            <div className="grid h-full grid-cols-1 md:grid-cols-2 gap-3">
              <EditorPane
                label="Left JSON"
                count={`${leftLineCount} line${leftLineCount !== 1 ? "s" : ""}`}
              >
                <EditorWrapper>
                  <MonacoEditor
                    value={leftJson}
                    onChange={(value) => setLeftJson(value || "")}
                    language="json"
                  />
                </EditorWrapper>
              </EditorPane>

              <EditorPane
                label="Right JSON"
                count={`${rightLineCount} line${rightLineCount !== 1 ? "s" : ""}`}
              >
                <EditorWrapper>
                  <MonacoEditor
                    value={rightJson}
                    onChange={(value) => setRightJson(value || "")}
                    language="json"
                  />
                </EditorWrapper>
              </EditorPane>
            </div>
          </div>

          <div className="h-full flex flex-col overflow-hidden">
            {leftResult.error && rightResult.error ? (
              <div className="pb-2 text-xs text-red-500 min-h-5">
                {leftResult.error ? `Left JSON error: ${leftResult.error}` : ""}
                {leftResult.error && rightResult.error ? " | " : ""}
                {rightResult.error
                  ? `Right JSON error: ${rightResult.error}`
                  : ""}
              </div>
            ) : (
              ""
            )}

            <div className="flex-1 overflow-hidden">
              <EnhancedDiffEditor
                height="100%"
                language="json"
                original={leftResult.formatted}
                modified={rightResult.formatted}
                leftLabel={leftTitle}
                rightLabel={rightTitle}
                defaultLeftLabel="Left"
                defaultRightLabel="Right"
                onLeftLabelChange={setLeftTitle}
                onRightLabelChange={setRightTitle}
                readOnly={false}
              />
            </div>
          </div>
        </Splitter>
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
