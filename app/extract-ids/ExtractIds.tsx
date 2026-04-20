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
import { InputCheckbox } from "@/components/InputCheckbox";
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
            <InputCheckbox
              checked={groupByObject}
              onChange={(event) => setGroupByObject(event.target.checked)}
              label="Group by object"
            />
            <InputCheckbox
              checked={convertTo18}
              onChange={(event) => setConvertTo18(event.target.checked)}
              label="Convert to 18 chars"
            />
          </SettingsGroup>

          <ActionButtons
            onSample={loadSample}
            onClear={clearAll}
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
