"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  processText,
  Transformation,
  TransformationType,
  CaseConvertMode,
  FilterLinesMode,
  ReplaceMode,
  FrequencyReportMode,
  FillMode,
  ExtractMode,
  SortMode,
  createTransformation,
  normalizeTransformation,
  getTransformationName,
} from "@/lib/text-processor";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
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
import { getIndexedDbValue } from "@/lib/indexed-db";
import { SAMPLE_TEXT_PROCESSOR_INPUT } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:text-tool";
const LEGACY_STORAGE_KEY = "sfdc-tools:text-processor";

const AVAILABLE_TRANSFORMATIONS: TransformationType[] = [
  'addPrefixSuffix',
  'caseConvert',
  'dedupe',
  'extract',
  'extractIds',
  'fill',
  'filterLines',
  'frequencyReport',
  'join',
  'pad',
  'removeBlankLines',
  'removePrefixSuffix',
  'replace',
  'shuffle',
  'sort',
  'split',
  'trim',
  'truncate',
];

const CASE_CONVERT_OPTIONS: Array<{ value: CaseConvertMode; label: string }> = [
  { value: "lower", label: "Lower" },
  { value: "upper", label: "Upper" },
  { value: "title", label: "Title" },
  { value: "sentense", label: "Sentense" },
];

const FILTER_LINES_OPTIONS: Array<{ value: FilterLinesMode; label: string }> = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts With" },
  { value: "endsWith", label: "Ends With" },
  { value: "regex", label: "Regex" },
  { value: "blank", label: "Blank" },
];

const REPLACE_MODE_OPTIONS: Array<{ value: ReplaceMode; label: string }> = [
  { value: "text", label: "Text" },
  { value: "regex", label: "Regex" },
];

const FREQUENCY_REPORT_OPTIONS: Array<{ value: FrequencyReportMode; label: string }> = [
  { value: "both", label: "Both" },
  { value: "duplicates", label: "Duplicates" },
  { value: "nonDuplicates", label: "Non Duplicates" },
];

const SORT_MODE_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "lexical", label: "Lexical" },
  { value: "length", label: "Length" },
  { value: "words", label: "Words" },
];

const FILL_MODE_OPTIONS: Array<{ value: FillMode; label: string }> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
];

const EXTRACT_MODE_OPTIONS: Array<{ value: ExtractMode; label: string }> = [
  { value: "numbers", label: "Numbers" },
  { value: "between", label: "Between" },
  { value: "afterString", label: "After String" },
  { value: "beforeString", label: "Before String" },
  { value: "regex", label: "Regex" },
];

export function TextProcessor() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [transformations, setTransformations] = usePersistedState<Transformation[]>(
    `${STORAGE_KEY}:transformations`,
    []
  );
  const [selectedTransformation, setSelectedTransformation] = usePersistedState<TransformationType>(
    `${STORAGE_KEY}:selected-transformation`,
    'trim'
  );
  const { showToast, ToastComponent } = useToast();
  const didMigrateRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (didMigrateRef.current || typeof window === "undefined") {
      return;
    }

    didMigrateRef.current = true;

    const legacyInputKey = `${LEGACY_STORAGE_KEY}:input`;
    const legacyTransformationsKey = `${LEGACY_STORAGE_KEY}:transformations`;
    const legacySelectedKey = `${LEGACY_STORAGE_KEY}:selected-transformation`;

    const currentInputKey = `${STORAGE_KEY}:input`;
    const currentTransformationsKey = `${STORAGE_KEY}:transformations`;
    const currentSelectedKey = `${STORAGE_KEY}:selected-transformation`;

    const migrateIndexedDbValue = async () => {
      const currentValue = await getIndexedDbValue(currentInputKey);
      if (currentValue !== null) {
        return;
      }

      const legacyValue = await getIndexedDbValue(legacyInputKey);
      if (legacyValue !== null) {
        setInput(legacyValue);
      }
    };

    void migrateIndexedDbValue();

    const currentTransformationsValue = window.localStorage.getItem(currentTransformationsKey);
    if (currentTransformationsValue === null) {
      const legacyTransformationsValue = window.localStorage.getItem(legacyTransformationsKey);
      if (legacyTransformationsValue !== null) {
        setTransformations(JSON.parse(legacyTransformationsValue));
      }
    }

    const currentSelectedValue = window.localStorage.getItem(currentSelectedKey);
    if (currentSelectedValue === null) {
      const legacySelectedValue = window.localStorage.getItem(legacySelectedKey);
      if (legacySelectedValue !== null) {
        setSelectedTransformation(JSON.parse(legacySelectedValue) as TransformationType);
      }
    }
  }, [setInput, setSelectedTransformation, setTransformations]);

  useEffect(() => {
    const normalized = transformations.map(normalizeTransformation);
    if (JSON.stringify(normalized) !== JSON.stringify(transformations)) {
      setTransformations(normalized);
    }
  }, [setTransformations, transformations]);

  // Process text as user types or transformations change
  const processTextInput = useCallback((text: string, trans: Transformation[]) => {
    if (!text.trim() || trans.length === 0) {
      setOutput(text);
      return;
    }

    const result = processText(text, trans);
    setOutput(result);
  }, []);

  // Auto-process on input or transformations change
  useEffect(() => {
    processTextInput(input, transformations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, transformations]);

  const addTransformation = () => {
    const newTransformation: Transformation = createTransformation(
      selectedTransformation,
      `${selectedTransformation}-${Date.now()}`
    );
    setTransformations([...transformations, newTransformation]);
  };

  const updateTransformation = (id: string, patch: Partial<Transformation>) => {
    setTransformations(
      transformations.map((transformation) =>
        transformation.id === id
          ? normalizeTransformation({ ...transformation, ...patch } as Transformation)
          : transformation
      )
    );
  };

  const removeTransformation = (id: string) => {
    setTransformations(transformations.filter(t => t.id !== id));
  };

  const moveTransformation = (id: string, direction: 'up' | 'down') => {
    const index = transformations.findIndex(t => t.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const newTransformations = [...transformations];
      [newTransformations[index - 1], newTransformations[index]] = 
        [newTransformations[index], newTransformations[index - 1]];
      setTransformations(newTransformations);
    } else if (direction === 'down' && index < transformations.length - 1) {
      const newTransformations = [...transformations];
      [newTransformations[index], newTransformations[index + 1]] = 
        [newTransformations[index + 1], newTransformations[index]];
      setTransformations(newTransformations);
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setTransformations([]);
  };
  const swapPanes = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
  };

  const loadSample = () => {
    setInput(SAMPLE_TEXT_PROCESSOR_INPUT);
    setTransformations([
      { id: "sample-trim", type: "trim", trimStart: true, trimEnd: true },
      { id: "sample-dedupe", type: "dedupe" },
      { id: "sample-sort", type: "sort", reverse: false, mode: "lexical" },
    ]);
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
            <SettingsLabel>Add:</SettingsLabel>
            <Select
              value={selectedTransformation}
              onChange={(e) => setSelectedTransformation(e.target.value as TransformationType)}
              className="min-w-[140px]"
            >
              {AVAILABLE_TRANSFORMATIONS.map((type) => (
                <option key={type} value={type}>
                  {getTransformationName(type)}
                </option>
              ))}
            </Select>
            <Button onClick={addTransformation} variant="secondary" size="sm">
              Add
            </Button>
            <Button
              onClick={() => setTransformations([])}
              variant="secondary"
              size="sm"
              disabled={transformations.length === 0}
            >
              Remove All
            </Button>
          </SettingsGroup>

          {/* Transformation List */}
          {mounted && transformations.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <SettingsLabel>Order:</SettingsLabel>
              {transformations.map((trans, index) => (
                <div
                  key={trans.id}
                  className="flex items-center gap-2 bg-[var(--hover-bg)] rounded-md px-3 py-2"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {index + 1}. {getTransformationName(trans.type)}
                  </span>
                  {trans.type === "pad" && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.padStart}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              padStart: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Start
                      </label>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.padEnd}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              padEnd: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        End
                      </label>
                      <label className="text-xs text-[var(--text-secondary)]">Length</label>
                      <input
                        type="number"
                        min="0"
                        value={trans.length}
                        onChange={(event) => {
                          const next = parseInt(event.target.value, 10);
                          updateTransformation(trans.id, {
                            length: Number.isFinite(next) && next >= 0 ? next : 0,
                          } as Partial<Transformation>);
                        }}
                        className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                      <label className="text-xs text-[var(--text-secondary)]">Pad</label>
                      <input
                        type="text"
                        value={trans.padString}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            padString: event.target.value,
                          } as Partial<Transformation>)
                        }
                        className="w-20 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                    </div>
                  )}
                  {trans.type === "truncate" && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.start}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              start: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Start
                      </label>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.end}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              end: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        End
                      </label>
                      <label className="text-xs text-[var(--text-secondary)]">Length</label>
                      <input
                        type="number"
                        min="0"
                        value={trans.length}
                        onChange={(event) => {
                          const next = parseInt(event.target.value, 10);
                          updateTransformation(trans.id, {
                            length: Number.isFinite(next) && next >= 0 ? next : 0,
                          } as Partial<Transformation>);
                        }}
                        className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.abbreviate}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              abbreviate: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Abbreviate
                      </label>
                    </div>
                  )}
                  {trans.type === "extract" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Mode</label>
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as ExtractMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {EXTRACT_MODE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {(trans.mode === "afterString" || trans.mode === "beforeString") && (
                        <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <input
                            type="checkbox"
                            checked={trans.last}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                last: event.target.checked,
                              } as Partial<Transformation>)
                            }
                          />
                          Last
                        </label>
                      )}
                      {trans.mode === "between" ? (
                        <>
                          <label className="text-xs text-[var(--text-secondary)]">Start</label>
                          <input
                            type="text"
                            value={trans.start}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                start: event.target.value,
                              } as Partial<Transformation>)
                            }
                            className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                          <label className="text-xs text-[var(--text-secondary)]">End</label>
                          <input
                            type="text"
                            value={trans.end}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                end: event.target.value,
                              } as Partial<Transformation>)
                            }
                            className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                        </>
                      ) : trans.mode !== "numbers" ? (
                        <>
                          <label className="text-xs text-[var(--text-secondary)]">String</label>
                          <input
                            type="text"
                            value={trans.string}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                string: event.target.value,
                              } as Partial<Transformation>)
                            }
                            className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                        </>
                      ) : null}
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.remove}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              remove: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Remove
                      </label>
                    </div>
                  )}
                  {trans.type === "extractIds" && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.groupByObject}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              groupByObject: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Group by Object
                      </label>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.convertTo18}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              convertTo18: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Convert to 18 chars
                      </label>
                    </div>
                  )}
                  {trans.type === "join" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Join String</label>
                      <input
                        type="text"
                        value={trans.joinString}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            joinString: event.target.value,
                          } as Partial<Transformation>)
                        }
                        className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                      <label className="text-xs text-[var(--text-secondary)]">Every n Lines</label>
                      <input
                        type="number"
                        min="0"
                        value={trans.everyNLines}
                        onChange={(event) => {
                          const next = parseInt(event.target.value, 10);
                          updateTransformation(trans.id, {
                            everyNLines: Number.isFinite(next) && next >= 0 ? next : 0,
                          } as Partial<Transformation>);
                        }}
                        className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                    </div>
                  )}
                  {trans.type === "fill" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Mode</label>
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as FillMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {FILL_MODE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <label className="text-xs text-[var(--text-secondary)]">Fill At</label>
                      <input
                        type="number"
                        min="0"
                        value={trans.fillAt}
                        onChange={(event) => {
                          const next = parseInt(event.target.value, 10);
                          updateTransformation(trans.id, {
                            fillAt: Number.isFinite(next) && next >= 0 ? next : 0,
                          } as Partial<Transformation>);
                        }}
                        className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                      {trans.mode === "text" && (
                        <>
                          <label className="text-xs text-[var(--text-secondary)]">Text</label>
                          <input
                            type="text"
                            value={trans.text}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                text: event.target.value,
                              } as Partial<Transformation>)
                            }
                            className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                        </>
                      )}
                      {trans.mode === "number" && (
                        <>
                          <label className="text-xs text-[var(--text-secondary)]">Start</label>
                          <input
                            type="number"
                            value={trans.startNumber}
                            onChange={(event) => {
                              const next = parseInt(event.target.value, 10);
                              updateTransformation(trans.id, {
                                startNumber: Number.isFinite(next) ? next : 0,
                              } as Partial<Transformation>);
                            }}
                            className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                          <label className="text-xs text-[var(--text-secondary)]">Step</label>
                          <input
                            type="number"
                            value={trans.step}
                            onChange={(event) => {
                              const next = parseInt(event.target.value, 10);
                              updateTransformation(trans.id, {
                                step: Number.isFinite(next) ? next : 1,
                              } as Partial<Transformation>);
                            }}
                            className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                          <label className="text-xs text-[var(--text-secondary)]">Pad Len</label>
                          <input
                            type="number"
                            min="0"
                            value={trans.padLength}
                            onChange={(event) => {
                              const next = parseInt(event.target.value, 10);
                              updateTransformation(trans.id, {
                                padLength: Number.isFinite(next) && next >= 0 ? next : 0,
                              } as Partial<Transformation>);
                            }}
                            className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                          <label className="text-xs text-[var(--text-secondary)]">Pad Char</label>
                          <input
                            type="text"
                            value={trans.padChar}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                padChar: event.target.value,
                              } as Partial<Transformation>)
                            }
                            className="w-16 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                          />
                        </>
                      )}
                    </div>
                  )}
                  {trans.type === "trim" && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.trimStart}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              trimStart: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Start
                      </label>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.trimEnd}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              trimEnd: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        End
                      </label>
                    </div>
                  )}
                  {(trans.type === "addPrefixSuffix" || trans.type === "removePrefixSuffix") && (
                    <div className="flex items-center gap-2">
                      {trans.type === "addPrefixSuffix" && (
                        <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <input
                            type="checkbox"
                            checked={trans.ifMissing}
                            onChange={(event) =>
                              updateTransformation(trans.id, {
                                ifMissing: event.target.checked,
                              } as Partial<Transformation>)
                            }
                          />
                          If Missing
                        </label>
                      )}
                      <label className="text-xs text-[var(--text-secondary)]">Prefix</label>
                      <input
                        type="text"
                        value={trans.prefix}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            prefix: event.target.value,
                          } as Partial<Transformation>)
                        }
                        className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                      <label className="text-xs text-[var(--text-secondary)]">Suffix</label>
                      <input
                        type="text"
                        value={trans.suffix}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            suffix: event.target.value,
                          } as Partial<Transformation>)
                        }
                        className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                    </div>
                  )}
                  {trans.type === "caseConvert" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Mode</label>
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as CaseConvertMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {CASE_CONVERT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {trans.type === "filterLines" && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.not}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              not: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Not
                      </label>
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as FilterLinesMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {FILTER_LINES_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {trans.mode !== "blank" && (
                        <input
                          type="text"
                          value={trans.value}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              value: event.target.value,
                            } as Partial<Transformation>)
                          }
                          placeholder={trans.mode === "regex" ? "Regex pattern" : "Value"}
                          className="w-32 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                        />
                      )}
                    </div>
                  )}
                  {trans.type === "replace" && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.all}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              all: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        All
                      </label>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.caseInsensitive}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              caseInsensitive: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Case Insensitive
                      </label>
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as ReplaceMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {REPLACE_MODE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={trans.find}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            find: event.target.value,
                          } as Partial<Transformation>)
                        }
                        placeholder={trans.mode === "regex" ? "Pattern" : "Find"}
                        className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                      <input
                        type="text"
                        value={trans.replaceWith}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            replaceWith: event.target.value,
                          } as Partial<Transformation>)
                        }
                        placeholder="Replace"
                        className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                    </div>
                  )}
                  {trans.type === "frequencyReport" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Mode</label>
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as FrequencyReportMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {FREQUENCY_REPORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.showCount}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              showCount: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Show Count
                      </label>
                    </div>
                  )}
                  {trans.type === "sort" && (
                    <div className="flex items-center gap-3">
                      <select
                        value={trans.mode}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            mode: event.target.value as SortMode,
                          } as Partial<Transformation>)
                        }
                        className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      >
                        {SORT_MODE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={trans.reverse}
                          onChange={(event) =>
                            updateTransformation(trans.id, {
                              reverse: event.target.checked,
                            } as Partial<Transformation>)
                          }
                        />
                        Reverse
                      </label>
                    </div>
                  )}
                  {trans.type === "split" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Split Chars</label>
                      <input
                        type="text"
                        value={trans.splitChars}
                        onChange={(event) =>
                          updateTransformation(trans.id, {
                            splitChars: event.target.value,
                          } as Partial<Transformation>)
                        }
                        className="w-24 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--input-text)]"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => moveTransformation(trans.id, 'up')}
                    disabled={index === 0}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveTransformation(trans.id, 'down')}
                    disabled={index === transformations.length - 1}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeTransformation(trans.id)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <ActionButtons
            onSample={loadSample}
            onSwap={swapPanes}
            onClear={clearAll}
            swapDisabled={!input || !output}
          />
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
                onChange={(value) => setOutput(value || "")}
                language="text"
              />
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>
      </div>
    </>
  );
}
