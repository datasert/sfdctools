"use client";

import { useMemo } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useToast } from "@/components/Toast";
import { MonacoEditor } from "@/components/MonacoEditor";
import { Checkbox } from "@/components/Checkbox";
import { EnhancedDiffEditor } from "@/components/EnhancedDiffEditor";
import { EditableLabel } from "@/components/EditableLabel";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { Splitter } from "@/components/Splitter";

const STORAGE_KEY = "sfdc-tools:omni-config-diff";

function deepSortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => deepSortJson(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
      sorted[key] = deepSortJson(record[key]);
    }
    return sorted;
  }

  return value;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeHtmlEntities(value: string): string {
  if (typeof window === "undefined") {
    return value;
  }

  const textarea = window.document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeEscapedNewlines(value: string): string {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function normalizeDecodedEmailBody(value: string): string {
  return normalizeEscapedNewlines(value)
    .replace(/\\"/g, '"');
}

function decodeEmailBodyValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => decodeEmailBodyValues(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      const child = record[key];
      if (key === "emailBody" && typeof child === "string") {
        next[key] = normalizeDecodedEmailBody(decodeHtmlEntities(child));
      } else {
        next[key] = decodeEmailBodyValues(child);
      }
    }
    return next;
  }

  return value;
}

function tryNormalizeJsonText(value: string, decodeEmailBody: boolean): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidates = Array.from(new Set([trimmed, safeDecodeURIComponent(trimmed)]));

  for (const candidate of candidates) {
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate);
      const transformed = decodeEmailBody ? decodeEmailBodyValues(parsed) : parsed;
      const sortedJsonText = JSON.stringify(deepSortJson(transformed), null, 2);
      return decodeEmailBody ? normalizeEscapedNewlines(sortedJsonText) : sortedJsonText;
    } catch {
      // Continue trying other decode variants
    }
  }

  return null;
}

function normalizeXmlJson(element: Element, decodeEmailBody: boolean): void {
  for (let index = 0; index < element.attributes.length; index += 1) {
    const attribute = element.attributes[index];
    const normalized = tryNormalizeJsonText(attribute.value, decodeEmailBody);
    if (normalized !== null) {
      attribute.value = normalized;
    }
  }

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent) {
      const normalized = tryNormalizeJsonText(child.textContent, decodeEmailBody);
      if (normalized !== null) {
        child.textContent = normalized;
      }
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      normalizeXmlJson(child as Element, decodeEmailBody);
    }
  }
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXMLAttribute(text: string): string {
  return escapeXML(text)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

function formatXmlNode(node: Element | Document | null, level: number, indentSize: number): string {
  if (!node || node.nodeType === Node.TEXT_NODE) {
    return "";
  }

  if (node.nodeType === Node.DOCUMENT_NODE) {
    const documentNode = node as Document;
    return formatXmlNode(documentNode.documentElement, level, indentSize);
  }

  const element = node as Element;
  const indent = " ".repeat(level * indentSize);
  const childIndent = " ".repeat((level + 1) * indentSize);
  let result = `${indent}<${element.tagName}`;

  if (element.attributes.length > 0) {
    for (let index = 0; index < element.attributes.length; index += 1) {
      const attribute = element.attributes[index];
      result += ` ${attribute.name}="${escapeXMLAttribute(attribute.value)}"`;
    }
  }

  const elementChildren = Array.from(element.childNodes).filter((child) => child.nodeType === Node.ELEMENT_NODE);
  const textValues = Array.from(element.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent ?? "")
    .filter((text) => text.trim().length > 0);

  if (elementChildren.length === 0 && textValues.length === 0) {
    return `${result} />`;
  }

  if (elementChildren.length === 0 && textValues.length > 0) {
    const textValue = textValues.join("\n").trim();
    const renderRaw = looksLikeJson(textValue);
    if (!textValue.includes("\n")) {
      const renderedValue = renderRaw ? textValue : escapeXML(textValue);
      return `${result}>${renderedValue}</${element.tagName}>`;
    }

    const lines = textValue.split("\n");
    result += ">\n";
    for (const line of lines) {
      const renderedLine = renderRaw ? line : escapeXML(line);
      result += `${childIndent}${renderedLine}\n`;
    }
    result += `${indent}</${element.tagName}>`;
    return result;
  }

  result += ">\n";

  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      result += `${formatXmlNode(child as Element, level + 1, indentSize)}\n`;
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? "").trim();
      if (text) {
        const renderRaw = looksLikeJson(text);
        for (const line of text.split("\n")) {
          const renderedLine = renderRaw ? line : escapeXML(line);
          result += `${childIndent}${renderedLine}\n`;
        }
      }
    }
  }

  result += `${indent}</${element.tagName}>`;
  return result;
}

function cleanupOmniXml(
  xml: string,
  options: { decodeJson: boolean; decodeEmailBody: boolean }
): { cleaned: string; error: string | null } {
  if (!xml.trim()) {
    return { cleaned: "", error: null };
  }

  if (!options.decodeJson) {
    return { cleaned: xml, error: null };
  }

  try {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(xml, "text/xml");
    const parserError = documentNode.querySelector("parsererror");
    if (parserError) {
      return { cleaned: "", error: parserError.textContent || "Invalid XML." };
    }

    if (options.decodeJson) {
      normalizeXmlJson(documentNode.documentElement, options.decodeEmailBody);
    }
    return {
      cleaned: formatXmlNode(documentNode.documentElement, 0, 2),
      error: null,
    };
  } catch (error) {
    return {
      cleaned: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function OmniConfigDiff() {
  const [leftXml, setLeftXml] = usePersistedState<string>(`${STORAGE_KEY}:left`, "");
  const [rightXml, setRightXml] = usePersistedState<string>(`${STORAGE_KEY}:right`, "");
  const [leftTitle, setLeftTitle] = usePersistedState<string>(`${STORAGE_KEY}:left-title`, "Left XML");
  const [rightTitle, setRightTitle] = usePersistedState<string>(`${STORAGE_KEY}:right-title`, "Right XML");
  const [decodeJson, setDecodeJson] = usePersistedState<boolean>(`${STORAGE_KEY}:decode-json`, true);
  const [decodeEmailBody, setDecodeEmailBody] = usePersistedState<boolean>(
    `${STORAGE_KEY}:decode-email-body`,
    true
  );
  const { showToast, ToastComponent } = useToast();

  const leftResult = useMemo(
    () => cleanupOmniXml(leftXml, { decodeJson, decodeEmailBody }),
    [leftXml, decodeJson, decodeEmailBody]
  );
  const rightResult = useMemo(
    () => cleanupOmniXml(rightXml, { decodeJson, decodeEmailBody }),
    [rightXml, decodeJson, decodeEmailBody]
  );

  const copyCleanedRight = () => {
    if (rightResult.cleaned && !rightResult.error) {
      navigator.clipboard.writeText(rightResult.cleaned);
      showToast("Cleaned right XML copied.");
    }
  };

  const clearAll = () => {
    setLeftXml("");
    setRightXml("");
  };

  const swapSides = () => {
    const previousLeft = leftXml;
    setLeftXml(rightXml);
    setRightXml(previousLeft);
  };

  const leftLineCount = leftXml ? leftXml.split("\n").length : 0;
  const rightLineCount = rightXml ? rightXml.split("\n").length : 0;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <Checkbox
              label="Decode Json"
              checked={decodeJson}
              onChange={(event) => setDecodeJson(event.target.checked)}
            />
            <Checkbox
              label="Decode Email Body"
              checked={decodeEmailBody}
              disabled={!decodeJson}
              onChange={(event) => setDecodeEmailBody(event.target.checked)}
            />
          </SettingsGroup>

          <ActionButtons
            onCopy={copyCleanedRight}
            onSwap={swapSides}
            onClear={clearAll}
            copyDisabled={!rightResult.cleaned || !!rightResult.error}
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
            <div className="grid h-full grid-cols-1 md:grid-cols-2 gap-3">
              <EditorPane
                label={
                  <div className="flex items-center gap-2">
                    <span>Left XML</span>
                    <EditableLabel
                      value={leftTitle}
                      onChange={setLeftTitle}
                      placeholder="Source name"
                      className="w-48"
                    />
                  </div>
                }
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
                label={
                  <div className="flex items-center gap-2">
                    <span>Right XML</span>
                    <EditableLabel
                      value={rightTitle}
                      onChange={setRightTitle}
                      placeholder="Source name"
                      className="w-48"
                    />
                  </div>
                }
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

          <div className="h-full flex flex-col overflow-hidden">
            <div className="pb-2 text-xs text-red-500 min-h-5">
              {leftResult.error ? `Left XML error: ${leftResult.error}` : ""}
              {leftResult.error && rightResult.error ? " | " : ""}
              {rightResult.error ? `Right XML error: ${rightResult.error}` : ""}
            </div>

            <div className="flex-1 overflow-hidden">
              <EnhancedDiffEditor
                height="100%"
                language="xml"
                original={leftResult.cleaned}
                modified={rightResult.cleaned}
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
    </>
  );
}
