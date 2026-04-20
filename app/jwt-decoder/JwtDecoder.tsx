"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { Input } from "@/components/Input";
import { ActionButtons } from "@/components/ActionButtons";
import { EditorGrid } from "@/components/EditorGrid";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { decodeJWT } from "@/lib/jwt-utils";
import { SAMPLE_JWT_SECRET, SAMPLE_JWT_TOKEN } from "@/lib/tool-samples";

const STORAGE_KEY = "sfdc-tools:jwt-decoder";

export function JwtDecoder() {
  const [input, setInput] = usePersistedState<string>(`${STORAGE_KEY}:input`, "");
  const [secret, setSecret] = usePersistedState<string>(`${STORAGE_KEY}:secret`, "");
  const [headerJson, setHeaderJson] = useState("");
  const [payloadJson, setPayloadJson] = useState("");
  const [signature, setSignature] = useState("");
  const [status, setStatus] = useState<"valid" | "expired" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // Decode JWT as user types
  const decodeJwt = useCallback(async (token: string, secretKey: string) => {
    if (!token.trim()) {
      setHeaderJson("");
      setPayloadJson("");
      setSignature("");
      setStatus(null);
      setError(null);
      return;
    }

    const result = await decodeJWT(token, secretKey);
    
    if (result.verificationError && !result.headerRaw) {
      // Parsing error
      setError(result.verificationError);
      setHeaderJson("");
      setPayloadJson("");
      setSignature("");
      setStatus(null);
    } else {
      setError(null);
      setHeaderJson(JSON.stringify(result.header, null, 2));
      setPayloadJson(JSON.stringify(result.payload, null, 2));
      setSignature(result.signature);
      setStatus(result.status);
      
      if (secretKey.trim()) {
        if (result.verificationError && !result.signatureValid) {
          setError(result.verificationError);
        }
      }
    }
  }, []);

  // Auto-decode on input or secret change
  useEffect(() => {
    decodeJwt(input, secret);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, secret]);

  const copySignature = () => {
    if (signature) {
      navigator.clipboard.writeText(signature);
      showToast("Signature copied to clipboard!");
    }
  };

  const clearAll = () => {
    setInput("");
    setSecret("");
    setHeaderJson("");
    setPayloadJson("");
    setSignature("");
    setStatus(null);
    setError(null);
  };

  const loadSample = () => {
    setInput(SAMPLE_JWT_TOKEN);
    setSecret(SAMPLE_JWT_SECRET);
    setError(null);
    showToast("Sample input loaded.");
  };

  const inputLineCount = input.split("\n").length;
  const headerLineCount = headerJson.split("\n").length;
  const payloadLineCount = payloadJson.split("\n").length;

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <SettingsBar>
          <SettingsGroup>
            <SettingsLabel>Secret Key (optional):</SettingsLabel>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-64"
              placeholder="Enter secret to verify signature"
            />
          </SettingsGroup>

          {(status !== null || error || input.trim()) && (
            <SettingsGroup className="flex-wrap">
              {status !== null && (
                <div
                  className={`rounded-md px-3 py-1.5 text-sm font-bold ${
                    status === "valid"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {status === "valid" ? "Valid" : "Expired"}
                </div>
              )}

              {secret.trim() ? (
                error ? (
                  <div className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                    {error}
                  </div>
                ) : null
              ) : input.trim() ? (
                <div className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Signature Not Verified
                </div>
              ) : null}
            </SettingsGroup>
          )}

          <ActionButtons
            onSample={loadSample}
            onClear={clearAll}
          />
        </SettingsBar>

        <EditorGrid
          layout="vertical"
          storageKey={`${STORAGE_KEY}:split:v2`}
          defaultSize={26}
          minSize={16}
          maxSize={45}
        >
          <EditorPane
            label="JWT Token"
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

          <EditorGrid layout="horizontal" storageKey={`${STORAGE_KEY}:header-payload-split`}>
          <EditorPane
            label="Header"
            count={`${headerLineCount} line${headerLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              {error && !headerJson ? (
                <div className="h-full flex items-center justify-center bg-[var(--content-color)] rounded-[0.5em] p-4">
                    <div className="text-sm text-red-500">
                      <div className="font-semibold mb-2">Decoding Error:</div>
                      <div className="text-xs">{error}</div>
                    </div>
                  </div>
                ) : (
                  <MonacoEditor
                    value={headerJson}
                    language="json"
                    readOnly={true}
                  />
                )}
              </EditorWrapper>
            </EditorPane>

          <EditorPane
            label="Payload"
            count={`${payloadLineCount} line${payloadLineCount !== 1 ? "s" : ""}`}
          >
            <EditorWrapper>
              {error && !payloadJson ? (
                <div className="h-full flex items-center justify-center bg-[var(--content-color)] rounded-[0.5em] p-4">
                    <div className="text-sm text-red-500">
                      <div className="font-semibold mb-2">Decoding Error:</div>
                      <div className="text-xs">{error}</div>
                    </div>
                  </div>
                ) : (
                  <MonacoEditor
                    value={payloadJson}
                    language="json"
                    readOnly={true}
                  />
                )}
              </EditorWrapper>
            </EditorPane>
          </EditorGrid>
        </EditorGrid>

        {/* Signature Display */}
        {signature && (
          <div className="border-t border-[var(--content-border)] p-4 bg-[var(--content-color)]">
            <div className="flex items-center justify-between mb-2">
              <SettingsLabel>Signature:</SettingsLabel>
              <button
                onClick={copySignature}
                className="px-2 py-1 text-xs rounded border border-[var(--content-border)] bg-[var(--content-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <div className="text-sm text-[var(--text-primary)] font-mono bg-[var(--content-faded-color)] p-3 rounded border border-[var(--content-border)] break-all">
              {signature}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
