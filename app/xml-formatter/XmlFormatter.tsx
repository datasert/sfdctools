"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/Input";
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
import { SAMPLE_XML } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:xml-formatter";

function formatXML(xml: string, indent: number): { formatted: string; error: string | null } {
  if (!xml.trim()) {
    return { formatted: "", error: null };
  }

  try {
    // Parse XML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      const errorText = parserError.textContent || "Invalid XML";
      return { formatted: "", error: errorText };
    }

    // Format XML with indentation
    const formatted = formatXMLNode(xmlDoc.documentElement, indent, 0);
    return { formatted, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { formatted: "", error: errorMessage };
  }
}

function formatXMLNode(node: Element | Document | null, indent: number, level: number): string {
  if (!node || node.nodeType === Node.TEXT_NODE) {
    return "";
  }

  if (node.nodeType === Node.DOCUMENT_NODE) {
    const doc = node as Document;
    return formatXMLNode(doc.documentElement, indent, level);
  }

  const element = node as Element;
  const indentStr = " ".repeat(indent * level);
  const childIndentStr = " ".repeat(indent * (level + 1));
  
  let result = `${indentStr}<${element.tagName}`;
  
  // Add attributes
  if (element.attributes && element.attributes.length > 0) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      result += ` ${attr.name}="${escapeXML(attr.value)}"`;
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
    result += `>${escapeXML(textContent)}</${element.tagName}>`;
    return result;
  }
  
  // Multiple children - format with indentation
  result += ">\n";
  
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      result += formatXMLNode(child as Element, indent, level + 1) + "\n";
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      result += childIndentStr + escapeXML(child.textContent.trim()) + "\n";
    }
  }
  
  result += `${indentStr}</${element.tagName}>`;
  return result;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function XmlFormatter() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = usePersistedState<number>(`${STORAGE_KEY}:indent`, 2);
  const { showToast, ToastComponent } = useToast();

  // Format XML as user types
  const formatXml = useCallback((xml: string, indentSize: number) => {
    const result = formatXML(xml, indentSize);
    setOutput(result.formatted);
    setError(result.error);
  }, []);

  // Auto-format on input or settings change
  useEffect(() => {
    formatXml(input, indent);
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
    </>
  );
}
