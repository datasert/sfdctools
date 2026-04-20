"use client";

import { useMemo, useState } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { useToast } from "@/components/Toast";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { ActionButtons } from "@/components/ActionButtons";
import { MonacoEditor } from "@/components/MonacoEditor";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { EnhancedDiffEditor } from "@/components/EnhancedDiffEditor";
import { Splitter } from "@/components/Splitter";
import { XmlCleanupDialog } from "@/components/XmlCleanupDialog";
import {
  defaultXmlCleanupOptions,
  formatXmlWithCleanup,
  type XmlCleanupOptions,
} from "@/lib/xml-cleanup";
import { SAMPLE_XML_LEFT, SAMPLE_XML_RIGHT } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:xml-diff";

export function XmlDiff() {
  const [leftXml, setLeftXml] = usePersistedTextState(`${STORAGE_KEY}:left`, "");
  const [rightXml, setRightXml] = usePersistedTextState(`${STORAGE_KEY}:right`, "");
  const [leftTitle, setLeftTitle] = usePersistedState<string>(
    `${STORAGE_KEY}:left-title`,
    "Left XML",
  );
  const [rightTitle, setRightTitle] = usePersistedState<string>(
    `${STORAGE_KEY}:right-title`,
    "Right XML",
  );
  const [indent, setIndent] = usePersistedState<number>(
    `${STORAGE_KEY}:indent`,
    2,
  );
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

  const leftResult = useMemo(
    () => formatXmlWithCleanup(leftXml, indent, normalizedCleanupOptions),
    [leftXml, indent, normalizedCleanupOptions],
  );
  const rightResult = useMemo(
    () => formatXmlWithCleanup(rightXml, indent, normalizedCleanupOptions),
    [rightXml, indent, normalizedCleanupOptions],
  );
  const clearAll = () => {
    setLeftXml("");
    setRightXml("");
  };

  const swapSides = () => {
    const previousLeft = leftXml;
    setLeftXml(rightXml);
    setRightXml(previousLeft);
  };

  const loadSample = () => {
    setLeftXml(SAMPLE_XML_LEFT);
    setRightXml(SAMPLE_XML_RIGHT);
    showToast("Sample input loaded.");
  };

  const leftLineCount = leftXml ? leftXml.split("\n").length : 0;
  const rightLineCount = rightXml ? rightXml.split("\n").length : 0;

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
            onSample={loadSample}
            onSwap={swapSides}
            onClear={clearAll}
            swapDisabled={!leftXml && !rightXml}
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
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2">
              <EditorPane
                label="Left XML"
                count={`${leftLineCount} line${leftLineCount !== 1 ? "s" : ""}`}
              >
                <EditorWrapper>
                  <MonacoEditor
                    value={leftXml}
                    onChange={(value) => setLeftXml(value || "")}
                    language="xml"
                  />
                </EditorWrapper>
              </EditorPane>

              <EditorPane
                label="Right XML"
                count={`${rightLineCount} line${rightLineCount !== 1 ? "s" : ""}`}
              >
                <EditorWrapper>
                  <MonacoEditor
                    value={rightXml}
                    onChange={(value) => setRightXml(value || "")}
                    language="xml"
                  />
                </EditorWrapper>
              </EditorPane>
            </div>
          </div>

          <div className="flex h-full flex-col overflow-hidden">
            {leftResult.error && rightResult.error ? (
              <div className="min-h-5 pb-2 text-xs text-red-500">
                {leftResult.error ? `Left XML error: ${leftResult.error}` : ""}
                {leftResult.error && rightResult.error ? " | " : ""}
                {rightResult.error ? `Right XML error: ${rightResult.error}` : ""}
              </div>
            ) : (
              ""
            )}

            <div className="flex-1 overflow-hidden">
              <EnhancedDiffEditor
                height="100%"
                language="xml"
                original={leftResult.formatted}
                modified={rightResult.formatted}
                leftLabel={leftTitle}
                rightLabel={rightTitle}
                defaultLeftLabel="Left XML"
                defaultRightLabel="Right XML"
                onLeftLabelChange={setLeftTitle}
                onRightLabelChange={setRightTitle}
                readOnly={false}
              />
            </div>
          </div>
        </Splitter>
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
