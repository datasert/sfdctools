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

const STORAGE_KEY = "sfdc-tools:url-encoder";

function encodeURL(text: string): { encoded: string; error: string | null } {
  if (!text.trim()) {
    return { encoded: "", error: null };
  }

  try {
    const encoded = encodeURIComponent(text);
    return { encoded, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { encoded: "", error: errorMessage };
  }
}

function decodeURL(encoded: string): { decoded: string; error: string | null } {
  if (!encoded.trim()) {
    return { decoded: "", error: null };
  }

  try {
    const decoded = decodeURIComponent(encoded);
    return { decoded, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { decoded: "", error: errorMessage };
  }
}

interface ParsedUrl {
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  queryParams: Record<string, string>;
}

function parseURL(url: string): { parsed: ParsedUrl | null; error: string | null } {
  if (!url.trim()) {
    return { parsed: null, error: null };
  }

  try {
    const urlObj = new URL(url);
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const parsed: ParsedUrl = {
      protocol: urlObj.protocol,
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port || "",
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
      queryParams,
    };

    return { parsed, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { parsed: null, error: errorMessage };
  }
}

export function UrlEncoder() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = usePersistedState<"encode" | "decode">(`${STORAGE_KEY}:mode`, "decode");
  const [parsedUrl, setParsedUrl] = useState<ParsedUrl | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // Convert as user types
  const convert = useCallback((text: string, convertMode: "encode" | "decode") => {
    if (convertMode === "encode") {
      const result = encodeURL(text);
      setOutput(result.encoded);
      setError(result.error);
    } else {
      const result = decodeURL(text);
      setOutput(result.decoded);
      setError(result.error);
    }
  }, []);

  // Parse URL when output changes (for decode mode) or input changes (for encode mode)
  useEffect(() => {
    const urlToParse = mode === "decode" && output ? output : mode === "encode" && input ? input : "";
    if (urlToParse) {
      const result = parseURL(urlToParse);
      setParsedUrl(result.parsed);
      setParseError(result.error);
    } else {
      setParsedUrl(null);
      setParseError(null);
    }
  }, [input, output, mode]);

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
    setParsedUrl(null);
    setParseError(null);
  };

  const swapPanes = () => {
    if (output && !error) {
      setInput(output);
      setOutput("");
      // Toggle mode when swapping
      setMode(mode === "encode" ? "decode" : "encode");
    }
  };

  const inputLineCount = input.split("\n").length;
  const outputLineCount = output.split("\n").length;

  const inputLabel = mode === "encode" ? "Input Text" : "Input URL Encoded";
  const outputLabel = mode === "encode" ? "URL Encoded" : "Decoded Text";

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
                language="text"
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
                  language="text"
                  readOnly={true}
                />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>

        {/* Parsed URL Details */}
        {(parsedUrl || parseError) && (
          <div className="border-t border-[var(--content-border)] p-4 bg-[var(--content-color)]">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Parsed URL Details</h3>
            {parseError ? (
              <div className="text-sm text-red-500">
                <div className="font-semibold mb-2">Parse Error:</div>
                <div className="text-xs">{parseError}</div>
              </div>
            ) : parsedUrl ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <SettingsLabel>Protocol:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)]">
                      {parsedUrl.protocol || "(none)"}
                    </div>
                  </div>
                  <div>
                    <SettingsLabel>Host:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)]">
                      {parsedUrl.host || "(none)"}
                    </div>
                  </div>
                  <div>
                    <SettingsLabel>Hostname:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)]">
                      {parsedUrl.hostname || "(none)"}
                    </div>
                  </div>
                  <div>
                    <SettingsLabel>Port:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)]">
                      {parsedUrl.port || "(default)"}
                    </div>
                  </div>
                  <div>
                    <SettingsLabel>Pathname:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)] break-all">
                      {parsedUrl.pathname || "(none)"}
                    </div>
                  </div>
                  <div>
                    <SettingsLabel>Hash:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)] break-all">
                      {parsedUrl.hash || "(none)"}
                    </div>
                  </div>
                </div>
                <div>
                  <SettingsLabel>Origin:</SettingsLabel>
                  <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)] break-all">
                    {parsedUrl.origin || "(none)"}
                  </div>
                </div>
                {parsedUrl.search && (
                  <div>
                    <SettingsLabel>Query String:</SettingsLabel>
                    <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)] break-all">
                      {parsedUrl.search}
                    </div>
                  </div>
                )}
                {Object.keys(parsedUrl.queryParams).length > 0 && (
                  <div>
                    <SettingsLabel>Query Parameters:</SettingsLabel>
                    <div className="space-y-2 mt-2">
                      {Object.entries(parsedUrl.queryParams).map(([key, value]) => (
                        <div key={key} className="flex gap-2 items-start">
                          <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)] min-w-[200px]">
                            {key}
                          </div>
                          <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-2 rounded border border-[var(--content-border)] flex-1 break-all">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
