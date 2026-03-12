"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { Checkbox } from "@/components/Checkbox";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { SAMPLE_HTML } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:html-formatter";

function formatHTML(html: string, indent: number): { formatted: string; error: string | null } {
  if (!html.trim()) {
    return { formatted: "", error: null };
  }

  try {
    // Parse HTML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(html, "text/html");
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      const errorText = parserError.textContent || "Invalid HTML";
      return { formatted: "", error: errorText };
    }

    // Preserve full documents, including doctype/head/body, and avoid wrapping fragments in a synthetic body tag.
    const formatted = isFullHtmlDocument(html)
      ? formatHTMLDocument(xmlDoc, indent)
      : formatHTMLFragment(xmlDoc, indent);
    return { formatted, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { formatted: "", error: errorMessage };
  }
}

function isFullHtmlDocument(html: string): boolean {
  return /<!doctype\s+html\b|<html\b/i.test(html);
}

function formatHTMLDocument(doc: Document, indent: number): string {
  const parts: string[] = [];
  const doctype = doc.doctype;

  if (doctype) {
    parts.push(formatDocumentType(doctype));
  } else if (/^html$/i.test(doc.documentElement.tagName)) {
    parts.push("<!DOCTYPE html>");
  }

  parts.push(formatHTMLNode(doc.documentElement, indent, 0));
  return parts.join("\n");
}

function formatHTMLFragment(doc: Document, indent: number): string {
  return Array.from(doc.body.childNodes)
    .map((child) => formatHTMLChild(child, indent, 0))
    .filter(Boolean)
    .join("\n");
}

function formatDocumentType(doctype: DocumentType): string {
  let result = `<!DOCTYPE ${doctype.name}`;
  if (doctype.publicId) {
    result += ` PUBLIC "${doctype.publicId}"`;
  }
  if (doctype.systemId) {
    result += `${doctype.publicId ? "" : " SYSTEM"} "${doctype.systemId}"`;
  }
  result += ">";
  return result;
}

function formatHTMLChild(node: ChildNode, indent: number, level: number): string {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return formatHTMLNode(node as Element, indent, level);
  }

  if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
    const indentStr = " ".repeat(indent * level);
    return `${indentStr}${escapeHTML(node.textContent.trim())}`;
  }

  return "";
}

function formatHTMLNode(node: Element | Document | null, indent: number, level: number): string {
  if (!node || node.nodeType === Node.TEXT_NODE) {
    return "";
  }

  if (node.nodeType === Node.DOCUMENT_NODE) {
    const doc = node as Document;
    return formatHTMLDocument(doc, indent);
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  const indentStr = " ".repeat(indent * level);
  const childIndentStr = " ".repeat(indent * (level + 1));
  
  let result = `${indentStr}<${tagName}`;
  
  // Add attributes
  if (element.attributes && element.attributes.length > 0) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      result += ` ${attr.name}="${escapeHTML(attr.value)}"`;
    }
  }
  
  // Check for children
  const children = Array.from(element.childNodes).filter(
    (child) => child.nodeType === Node.ELEMENT_NODE || (child.nodeType === Node.TEXT_NODE && child.textContent?.trim())
  );
  
  if (children.length === 0) {
    result += " />";
    return result;
  }

  if (isRawTextElement(tagName)) {
    const rawContent = Array.from(element.childNodes)
      .map((child) => child.textContent ?? "")
      .join("")
      .trim();

    if (!rawContent) {
      return `${result}></${tagName}>`;
    }

    return `${result}>\n${childIndentStr}${rawContent}\n${indentStr}</${tagName}>`;
  }
  
  // Check if there's only text content
  const textNodes = Array.from(element.childNodes).filter(
    (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
  );
  const elementNodes = Array.from(element.childNodes).filter(
    (child) => child.nodeType === Node.ELEMENT_NODE
  );
  
  if (textNodes.length > 0 && elementNodes.length === 0) {
    // Single text node - put on same line
    const textContent = textNodes[0].textContent?.trim() || "";
    result += `>${escapeHTML(textContent)}</${tagName}>`;
    return result;
  }
  
  // Multiple children - format with indentation
  result += ">\n";
  
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      result += formatHTMLNode(child as Element, indent, level + 1) + "\n";
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      result += childIndentStr + escapeHTML(child.textContent.trim()) + "\n";
    }
  }
  
  result += `${indentStr}</${tagName}>`;
  return result;
}

function isRawTextElement(tagName: string): boolean {
  return tagName === "script" || tagName === "style";
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function HtmlFormatter() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = usePersistedState<number>(`${STORAGE_KEY}:indent`, 2);
  const [showPreview, setShowPreview] = usePersistedState<boolean>(`${STORAGE_KEY}:showPreview`, false);
  const { showToast, ToastComponent } = useToast();

  // Format HTML as user types
  const formatHtml = useCallback((html: string, indentSize: number) => {
    const result = formatHTML(html, indentSize);
    setOutput(result.formatted);
    setError(result.error);
  }, []);

  // Auto-format on input or settings change
  useEffect(() => {
    formatHtml(input, indent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, indent]);

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
    setInput(SAMPLE_HTML);
    setError(null);
    showToast("Sample input loaded.");
  };

  const inputLineCount = input.split("\n").length;
  const outputLineCount = output.split("\n").length;

  // Use formatted output for preview, or input if output is empty/error
  const previewContent = (output && !error) ? output : input;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
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

          <SettingsGroup>
            <Checkbox
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              label="Show Preview"
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
            label="Input HTML"
            count={`${inputLineCount} line${inputLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              <MonacoEditor
                value={input}
                onChange={(value) => setInput(value || "")}
                language="html"
              />
            </EditorWrapper>
          </EditorPane>

          <EditorPane
            label="Formatted HTML"
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
                  language="html"
                  readOnly={true}
                />
              )}
            </EditorWrapper>
          </EditorPane>
        </EditorGrid>

        {/* HTML Preview */}
        {showPreview && previewContent && (
          <div className="border-t border-[var(--content-border)] bg-[var(--content-color)]">
            <div className="p-4 border-b border-[var(--content-border)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Preview</h3>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={previewContent}
                className="w-full border border-[var(--content-border)] rounded bg-white"
                style={{ minHeight: "400px", height: "400px" }}
                title="HTML Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
