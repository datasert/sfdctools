"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { parse, evaluate, format, formatLiteral, FUNCTION_HELP } from "@datasert/formulate";
import type { EvalStep, LiteralNode, ErrorNode, FunctionHelp } from "@datasert/formulate";
import type { editor } from "monaco-editor";
import { MonacoEditor } from "@/components/MonacoEditor";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { Button } from "@/components/Button";
import { Splitter } from "@/components/Splitter";

const STORAGE_KEY = "sfdc-tools:sf-formula";

const SAMPLE = `IF(
  AND(Amount > 1000, ISPICKVAL(Stage__c, "Closed Won")),
  Opportunity__r.Account.Name & " - High Value",
  "Review Required"
)`;

type Tab = "parse" | "evaluate";
type FieldType = "text" | "number" | "boolean" | "currency" | "percent" | "date" | "datetime" | "time";
const FIELD_TYPES: FieldType[] = ["text", "number", "boolean", "currency", "percent", "date", "datetime", "time"];

interface FieldEntry {
  type: FieldType;
  value: string;
}

// ─── JSON syntax highlighter ──────────────────────────────────────────────────

function highlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(?:\\.|[^"\\])*")\s*:/g,
      '<span style="color:var(--accent-color)">$1</span>:',
    )
    .replace(
      /:\s*("(?:\\.|[^"\\])*")/g,
      ': <span style="color:var(--text-primary)">$1</span>',
    )
    .replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      ': <span style="color:#d97706">$1</span>',
    )
    .replace(
      /:\s*(true|false)/g,
      ': <span style="color:var(--danger-color)">$1</span>',
    )
    .replace(
      /:\s*(null)/g,
      ': <span style="color:var(--text-tertiary)">$1</span>',
    );
}

// ─── Step tree node ───────────────────────────────────────────────────────────

function StepNode({ step }: { step: EvalStep }) {
  const [open, setOpen] = useState(true);
  const hasChildren = step.children.length > 0;

  // Strip leading comment block (/*...*/) — comments are transparent in evaluation
  const displayText = step.text.replace(/^\/\*[\s\S]*?\*\/\s*/, "");

  const resultStr = step.skipped
    ? null
    : step.result
      ? step.result.type === "error"
        ? (step.result as ErrorNode).message
        : formatLiteral(step.result as LiteralNode)
      : null;

  // Strip surrounding quotes from text results for display only
  const resultDisplay =
    resultStr !== null && resultStr.startsWith('"') && resultStr.endsWith('"')
      ? resultStr.slice(1, -1)
      : resultStr;

  // Skip leaf literal nodes — they just echo themselves (e.g. "Closed Won" → Closed Won)
  if (!hasChildren && !step.skipped && resultStr !== null) {
    const t = displayText;
    const isLiteral =
      t === resultStr ||
      (t.startsWith('"') && t.endsWith('"') && t.slice(1, -1) === resultStr) ||
      (t.startsWith("'") && t.endsWith("'") && t.slice(1, -1) === resultStr);
    if (isLiteral) return null;
  }

  return (
    <div className="text-sm font-mono leading-relaxed">
      <div
        className={`flex items-baseline gap-1.5 rounded px-1 py-px hover:bg-[var(--hover-bg)] ${
          step.skipped ? "opacity-35" : ""
        } ${hasChildren ? "cursor-pointer select-none" : ""}`}
        onClick={hasChildren ? () => setOpen((o) => !o) : undefined}
      >
        <span className="w-3 shrink-0 text-xs text-[var(--text-tertiary)]">
          {hasChildren ? (open ? "▼" : "▶") : ""}
        </span>
        <span className="rounded bg-[var(--content-faded-color)] px-1.5 py-0.5 text-[var(--content-text)]">{displayText}</span>
        {step.skipped && (
          <span className="ml-1 rounded-full border border-[var(--border-color)] px-1.5 text-[10px] text-[var(--text-tertiary)]">
            skipped
          </span>
        )}
        {resultStr !== null && (
          <>
            <span className="text-[var(--text-tertiary)]">→</span>
            <span
              className={`rounded px-1.5 py-0.5 font-semibold ${
                step.result?.type === "error"
                  ? "bg-[color-mix(in_srgb,var(--danger-color)_12%,transparent)] text-[var(--danger-color)]"
                  : (step.result as LiteralNode)?.dataType === "checkbox"
                    ? (step.result as LiteralNode).value === true
                      ? "bg-[color-mix(in_srgb,#16a34a_12%,transparent)] text-[#16a34a]"
                      : "bg-[color-mix(in_srgb,#d97706_12%,transparent)] text-[#d97706]"
                    : "bg-[color-mix(in_srgb,var(--accent-color)_12%,transparent)] text-[var(--accent-color)]"
              }`}
            >
              {resultDisplay}
            </span>
          </>
        )}
      </div>
      {hasChildren && open && (
        <div className="ml-3 border-l border-[var(--border-color)] pl-2">
          {step.children.map((child, i) => (
            <StepNode key={i} step={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Field value input ────────────────────────────────────────────────────────

const cellCls =
  "w-full rounded border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--primary-color)] transition-colors";

function FieldValueInput({
  entry,
  onChange,
}: {
  entry: FieldEntry;
  onChange: (value: string) => void;
}) {
  const { type, value } = entry;

  if (type === "boolean") {
    return (
      <select
        className={cellCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        <option value="true">TRUE</option>
        <option value="false">FALSE</option>
      </select>
    );
  }

  return (
    <input
      type={
        type === "number" || type === "currency" || type === "percent"
          ? "number"
          : type === "date"
            ? "date"
            : type === "datetime"
              ? "datetime-local"
              : type === "time"
                ? "time"
                : "text"
      }
      step={type === "time" ? "1" : type === "percent" ? "1" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cellCls}
      placeholder={
        type === "text" ? "(text value)" :
        type === "percent" ? "(e.g. 90 for 90%)" :
        type === "currency" ? "(numeric)" : ""
      }
    />
  );
}

function PanelHeader({ label }: { label: string }) {
  return (
    <div className="shrink-0 border-b border-[var(--content-border)] bg-[var(--content-faded-color)] px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </span>
    </div>
  );
}

// ─── Function help panel ──────────────────────────────────────────────────────

function FunctionHelpPanel({ fnName }: { fnName: string | null }) {
  const help: FunctionHelp | undefined = fnName ? FUNCTION_HELP[fnName] : undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--content-border)] bg-[var(--content-faded-color)] px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Function Reference
        </span>
      </div>
      <div className="flex-1 overflow-auto bg-[var(--content-color)] p-4">
        {!help ? (
          <p className="text-sm italic text-[var(--text-tertiary)]">
            {fnName
              ? `No documentation found for ${fnName}.`
              : "Place your cursor on a function name to see its documentation."}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Name + not-implemented badge */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[var(--content-text)]">
                {fnName}
              </span>
              {help.notImplemented && (
                <span className="rounded-full border border-[var(--border-color)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  not supported
                </span>
              )}
            </div>

            {/* Syntax */}
            <div className="rounded-md bg-[var(--content-faded-color)] px-3 py-2">
              <code className="font-mono text-sm text-[var(--accent-color)]">
                {help.syntax}
              </code>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-[var(--content-text)]">
              {help.description}
            </p>

            {/* Parameters */}
            {help.params.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Parameters
                </div>
                <div className="space-y-2">
                  {help.params.map((p, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0 font-mono text-[var(--accent-color)]">
                        {p.name}
                      </span>
                      <span className="text-[var(--text-secondary)]">—</span>
                      <span className="text-[var(--text-secondary)]">{p.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Returns */}
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Returns
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{help.returns}</p>
            </div>

            {/* Example */}
            {help.example && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Example
                </div>
                <div className="rounded-md bg-[var(--content-faded-color)] px-3 py-2">
                  <code className="font-mono text-sm text-[var(--content-text)]">
                    {help.example}
                  </code>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SfFormula() {
  const [formula, setFormula] = usePersistedTextState(
    `${STORAGE_KEY}:formula`,
    "",
  );
  const [activeTab, setActiveTab] = useState<Tab>("evaluate");
  const [fields, setFields] = useState<Record<string, FieldEntry>>({});
  const [cursorFn, setCursorFn] = useState<string | null>(null);

  // Parse-derived state
  const [parseJson, setParseJson] = useState("");
  const [astJson, setAstJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  // Evaluate-derived state
  const [evalResult, setEvalResult] = useState<ReturnType<typeof evaluate> | null>(null);

  // Monaco editor instance ref for cursor tracking
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    editorInstance.onDidChangeCursorPosition((e) => {
      const model = editorInstance.getModel();
      if (!model) return;
      const word = model.getWordAtPosition(e.position);
      const name = word?.word.toUpperCase() ?? null;
      setCursorFn(name && FUNCTION_HELP[name] ? name : null);
    });
  }, []);

  // Run parse whenever formula changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const v = formula.trim();
    if (!v) {
      setParseJson("");
      setAstJson("");
      setParseError(null);
      setFields({});
      setEvalResult(null);
      return;
    }

    const result = parse(v);

    if (!result.success) {
      setParseError(result.error);
      setParseJson(
        JSON.stringify({ success: false, error: result.error }, null, 2),
      );
      setAstJson("");
      setFields({});
      setEvalResult(null);
      return;
    }

    setParseError(null);
    setParseJson(
      JSON.stringify(
        {
          success: true,
          fields: result.fields,
          functions: result.functions,
        },
        null,
        2,
      ),
    );
    setAstJson(JSON.stringify(result.ast, null, 2));

    // Preserve existing field values; add new fields; prune removed ones
    const sortedFields = [...result.fields].sort();
    setFields((prev) => {
      const next: Record<string, FieldEntry> = {};
      for (const name of sortedFields) {
        next[name] = prev[name] ?? { type: "text", value: "" };
      }
      return next;
    });
  }, [formula]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Re-evaluate whenever formula or field values change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!formula.trim() || parseError !== null) {
      setEvalResult(null);
      return;
    }

    const subs: Record<string, unknown> = {};
    const schema: Record<string, { type: string }> = {};

    for (const [name, { type, value }] of Object.entries(fields)) {
      if (!value) {
        subs[name] = null;
        continue;
      }
      if (type === "number" || type === "currency") {
        subs[name] = parseFloat(value);
        continue;
      }
      if (type === "percent") {
        subs[name] = parseFloat(value) / 100;
        continue;
      }
      if (type === "boolean") {
        subs[name] = value === "true";
        continue;
      }
      if (type === "date" || type === "datetime" || type === "time") {
        let v = value;
        if (type === "datetime" && /T\d{2}:\d{2}$/.test(v)) v += ":00";
        if (type === "time" && /^\d{1,2}:\d{2}$/.test(v)) v += ":00";
        subs[name] = v;
        schema[name] = { type };
        continue;
      }
      subs[name] = value;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEvalResult(evaluate(formula, subs, { schema: schema as any, steps: true }));
  }, [formula, fields, parseError]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateFieldType = useCallback((name: string, type: FieldType) => {
    setFields((prev) => ({ ...prev, [name]: { type, value: "" } }));
  }, []);

  const updateFieldValue = useCallback((name: string, value: string) => {
    setFields((prev) => ({ ...prev, [name]: { ...prev[name], value } }));
  }, []);

  const handleFormat = useCallback(() => {
    const v = formula.trim();
    if (!v) return;

    try {
      setFormula(format(v));
    } catch {
      // Leave the formula unchanged if formatting fails.
    }
  }, [formula, setFormula]);

  const fieldEntries = Object.entries(fields);

  return (
    <Splitter
      orientation="horizontal"
      defaultSize={80}
      minSize={45}
      maxSize={90}
      storageKey="sf-formula:main-splitter"
    >
      {/* ── Left: formula + tabs + content ──────────────────────────────────── */}
      <div className="flex h-full flex-col border-r border-[var(--content-border)]">
        {/* Formula input */}
        <div className="shrink-0 border-b border-[var(--content-border)] bg-[var(--content-color)]">
          <div className="flex items-center gap-3 border-b border-[var(--content-border)] px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Formula
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFormat}
                disabled={!formula.trim()}
              >
                Format
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFormula(SAMPLE)}
              >
                Load Sample
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open("https://help.salesforce.com/s/articleView?id=platform.customize_functions_parent.htm&type=5", "_blank")}
              >
                SF Help
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFormula("")}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="h-28">
            <MonacoEditor
              value={formula}
              onChange={(v) => setFormula(v || "")}
              language="javascript"
              onMount={handleEditorMount}
            />
          </div>
          {parseError && (
            <div className="border-t border-[var(--danger-color)] border-opacity-30 bg-[color-mix(in_srgb,var(--danger-color)_8%,transparent)] px-3 py-2 text-xs text-[var(--danger-color)]">
              {parseError}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="shrink-0 flex border-b border-[var(--content-border)] bg-[var(--content-color)]">
          {(["parse", "evaluate"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-xs font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                  : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab === "parse" ? "Parse" : "Evaluate"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-0 flex-1 overflow-hidden">

          {/* Parse tab */}
          {activeTab === "parse" && (
            <div className="flex h-full flex-col">
              {/* Parse Result / AST panels */}
              <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-[var(--content-border)]">
                  <PanelHeader label="Parse Result" />
                  <div className="flex-1 overflow-auto bg-[var(--content-color)] p-3">
                    <pre
                      className="font-mono text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: parseJson ? highlight(parseJson) : "",
                      }}
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                  <PanelHeader label="AST" />
                  <div className="flex-1 overflow-auto bg-[var(--content-color)] p-3">
                    <pre
                      className="font-mono text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: astJson ? highlight(astJson) : "",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluate tab */}
          {activeTab === "evaluate" && (
            <Splitter
              orientation="horizontal"
              defaultSize={40}
              minSize={20}
              maxSize={75}
              storageKey="sf-formula:evaluate-splitter"
            >
              {/* Left: field values */}
              <div className="flex h-full flex-col border-r border-[var(--content-border)]">
                <PanelHeader label="Field Values" />
                <div className="flex-1 overflow-auto">
                  {fieldEntries.length === 0 ? (
                    <p className="p-4 text-xs italic text-[var(--text-tertiary)]">
                      {formula.trim() && !parseError
                        ? "No fields referenced in this formula."
                        : "Enter a valid formula to see fields."}
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="sticky top-0 bg-[var(--content-faded-color)]">
                          <th className="border-b border-[var(--content-border)] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Field
                          </th>
                          <th className="w-28 border-b border-[var(--content-border)] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Type
                          </th>
                          <th className="border-b border-[var(--content-border)] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fieldEntries.map(([name, entry]) => (
                          <tr
                            key={name}
                            className="border-b border-[var(--content-border)] hover:bg-[var(--hover-bg)]"
                          >
                            <td className="px-3 py-1.5 font-mono font-medium text-[var(--accent-color)]">
                              {name}
                            </td>
                            <td className="px-3 py-1.5">
                              <select
                                value={entry.type}
                                onChange={(e) =>
                                  updateFieldType(name, e.target.value as FieldType)
                                }
                                className={cellCls}
                              >
                                {FIELD_TYPES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-1.5">
                              <FieldValueInput
                                entry={entry}
                                onChange={(v) => updateFieldValue(name, v)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right: result + step tree */}
              <div className="flex h-full flex-col overflow-hidden">
                <PanelHeader label="Evaluation Steps" />
                {/* Result box */}
                <div className="shrink-0 min-h-[46px] flex items-center border-b border-[var(--content-border)] bg-[var(--content-color)] px-4 py-2">
                  {evalResult && (() => {
                    const r = evalResult.result;
                    const isErr = r.type === "error";
                    const label = isErr
                      ? (r as ErrorNode).errorType
                      : (r as LiteralNode).dataType;
                    return (
                      <div
                        className="inline-flex items-center gap-2.5 rounded-md border px-3 py-1.5 text-sm"
                        style={{
                          background: isErr
                            ? "color-mix(in srgb, var(--danger-color) 12%, transparent)"
                            : "color-mix(in srgb, #16a34a 12%, transparent)",
                          borderColor: isErr
                            ? "color-mix(in srgb, var(--danger-color) 35%, transparent)"
                            : "color-mix(in srgb, #16a34a 35%, transparent)",
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                          {label}
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            color: isErr ? "var(--danger-color)" : "#16a34a",
                          }}
                        >
                          {evalResult.output}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                {/* Step tree */}
                <div className="flex-1 overflow-auto bg-[var(--content-color)] p-3">
                  {evalResult?.steps && <StepNode step={evalResult.steps} />}
                </div>
              </div>
            </Splitter>
          )}
        </div>
      </div>

      {/* ── Right: function reference panel ─────────────────────────────────── */}
      <FunctionHelpPanel fnName={cursorFn} />
    </Splitter>
  );
}
