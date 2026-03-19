"use client";

import {
  convertExtractedIdsTo18,
  extractSalesforceIds,
  formatExtractedIds,
} from "@/lib/extract-ids";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { useToast } from "@/components/Toast";
import { SAMPLE_EXTRACT_IDS } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:extract-ids";

export function ExtractIds() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [groupByObject, setGroupByObject] = usePersistedState<boolean>(
    `${STORAGE_KEY}:group-by-object`,
    true
  );
  const [convertTo18, setConvertTo18] = usePersistedState<boolean>(
    `${STORAGE_KEY}:convert-to-18`,
    true
  );
  const { showToast, ToastComponent } = useToast();

  const extractedIds = convertTo18
    ? convertExtractedIdsTo18(extractSalesforceIds(input))
    : extractSalesforceIds(input);
  const output = formatExtractedIds(extractedIds, groupByObject);

  const clearAll = () => {
    setInput("");
  };

  const copyOutput = () => {
    if (!output) {
      return;
    }

    navigator.clipboard.writeText(output);
    showToast("Copied to clipboard!");
  };

  const loadSample = () => {
    setInput(SAMPLE_EXTRACT_IDS);
    showToast("Sample input loaded.");
  };

  const inputCount = extractedIds.length;
  const outputCount = extractedIds.length;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={groupByObject}
                onChange={(event) => setGroupByObject(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--input-border)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
              />
              Group by object
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={convertTo18}
                onChange={(event) => setConvertTo18(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--input-border)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
              />
              Convert to 18 chars
            </label>
          </SettingsGroup>

          <ActionButtons
            onSample={loadSample}
            onCopy={copyOutput}
            onClear={clearAll}
            copyDisabled={!output}
          />
        </SettingsBar>

        <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:split`}>
          <EditorPane label="Input" count={`${inputCount} id${inputCount !== 1 ? "s" : ""}`}>
            <EditorWrapper>
              <MonacoEditor value={input} onChange={(value) => setInput(value || "")} language="text" />
            </EditorWrapper>
          </EditorPane>

          <EditorPane label="Output" count={`${outputCount} id${outputCount !== 1 ? "s" : ""}`}>
            <EditorWrapper>
              <MonacoEditor value={output} language="text" readOnly={true} />
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>
    </>
  );
}
