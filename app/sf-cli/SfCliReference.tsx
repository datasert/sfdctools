"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Splitter } from "@/components/Splitter";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";

interface Flag {
  flag: string;
  shorthand: string | null;
  required: boolean;
  type: string | null;
  default: string | null;
  options: string[] | null;
  description: string | null;
}

interface Example {
  description: string | null;
  command: string;
}

interface Command {
  command: string;
  category: string;
  summary: string;
  description: string | null;
  flags: Flag[];
  examples: Example[];
  aliases: string[];
}

interface CliData {
  cliVersion?: string;
  sfCliVersion?: string;
  generated: string;
  totalCommands: number;
  categories: Record<string, string[]>;
  commands: Command[];
}

const STORAGE_KEY = "sfdc-tools:sf-cli-reference";

const SYSTEM_FLAGS = new Set(["--json", "--flags-dir"]);

const toProperCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function buildCommand(command: string, flagValues: Record<string, string>): string {
  const parts = [`sf ${command}`];
  for (const [flagName, value] of Object.entries(flagValues)) {
    if (!value) continue;
    if (value === "true") {
      parts.push(flagName);
    } else {
      const needsQuotes = /\s/.test(value);
      parts.push(`${flagName} ${needsQuotes ? `"${value}"` : value}`);
    }
  }
  return parts.join(" ");
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}


function FlagInput({
  flag,
  value,
  onChange,
}: {
  flag: Flag;
  value: string;
  onChange: (val: string) => void;
}) {
  const isBoolean = flag.type === "boolean";
  const hasOptions = !!flag.options?.length;
  const inputId = `flag-${flag.flag.replace(/^--/, "")}`;

  return (
    <div className="flex flex-col gap-1">
      {/* Flag name + badges + input on one row */}
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="flex flex-shrink-0 items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
            {flag.flag}
          </span>
          {flag.shorthand && (
            <span className="font-mono text-sm text-[var(--text-tertiary)]">{flag.shorthand}</span>
          )}
          {flag.required && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs font-semibold text-rose-700">
              required
            </span>
          )}
          {flag.type && flag.type !== "option" && (
            <span className="rounded bg-[var(--hover-bg)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)]">
              {flag.type}
            </span>
          )}
        </label>

        <div className="min-w-0 flex-1">
          {isBoolean ? (
            <input
              id={inputId}
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "")}
              className="h-4 w-4 cursor-pointer accent-[var(--primary-color)]"
            />
          ) : hasOptions ? (
            <select
              id={inputId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--primary-color)] transition-colors"
            >
              <option value="">— not set —</option>
              {flag.options!.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}{flag.default === opt ? " (default)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={flag.default ? `default: ${flag.default}` : "Enter value…"}
              className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] transition-colors"
            />
          )}
        </div>
      </div>

      {/* Description below */}
      {flag.description && (
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{flag.description}</p>
      )}
    </div>
  );
}

function CommandDetail({
  command,
  onCopy,
}: {
  command: Command;
  onCopy: (msg: string) => void;
}) {
  const storageKey = `${STORAGE_KEY}:flags:${command.command}`;
  const [flagValues, setFlagValues] = usePersistedState<Record<string, string>>(storageKey, {});
  const [flagSearch, setFlagSearch] = useState("");
  const generatedCommand = buildCommand(command.command, flagValues);
  const hasValues = Object.values(flagValues).some(Boolean);

  const visibleFlags = useMemo(() => {
    const all = command.flags.filter((f) => !SYSTEM_FLAGS.has(f.flag));
    const term = flagSearch.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (f) =>
        f.flag.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term),
    );
  }, [command.flags, flagSearch]);

  const setFlag = useCallback(
    (flagName: string, value: string) => {
      setFlagValues((prev) => ({ ...prev, [flagName]: value }));
    },
    [setFlagValues],
  );

  const reset = () => setFlagValues({});

  const copy = async () => {
    await copyToClipboard(generatedCommand);
    onCopy("Command copied");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Command header */}
      <div className="border-b border-[var(--content-border)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-xl font-bold text-[var(--text-primary)]">
                sf {command.command}
              </h2>
              <span className="rounded-full border border-[var(--content-border)] bg-[var(--hover-bg)] px-2 py-0.5 text-sm text-[var(--text-secondary)]">
                {command.category}
              </span>
            </div>
            <p className="mt-1.5 text-base text-[var(--text-primary)]">{command.summary}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Description */}
        {command.description && (
          <div className="border-b border-[var(--content-border)] p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Description
            </h3>
            <div className="space-y-2">
              {command.description.split("\n\n").map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-[var(--text-primary)]">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Flag builder */}
        {command.flags.filter((f) => !SYSTEM_FLAGS.has(f.flag)).length > 0 && (
          <div className="border-b border-[var(--content-border)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="flex-shrink-0 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Flags
              </h3>
              <input
                type="search"
                value={flagSearch}
                onChange={(e) => setFlagSearch(e.target.value)}
                placeholder="Search flags…"
                style={{ width: "200px" }}
                className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] transition-colors"
              />
              {hasValues && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex-shrink-0 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>
            {visibleFlags.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No flags match.</p>
            ) : (
              <div className="space-y-4">
                {visibleFlags.map((flag) => (
                  <FlagInput
                    key={flag.flag}
                    flag={flag}
                    value={flagValues[flag.flag] ?? ""}
                    onChange={(val) => setFlag(flag.flag, val)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Examples */}
        {command.examples.length > 0 && (
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Examples
            </h3>
            <div className="space-y-3">
              {command.examples.map((ex, i) => (
                <div key={i} className="space-y-1">
                  {ex.description && (
                    <p className="text-sm text-[var(--text-secondary)]">{ex.description}</p>
                  )}
                  <div
                    className="group flex cursor-pointer items-start justify-between gap-2 rounded-[0.375em] border border-[var(--content-border)] bg-[var(--content-faded-color)] p-2.5 hover:bg-[var(--hover-bg)] transition-colors"
                    onClick={() => {
                      void copyToClipboard(ex.command).then(() => onCopy("Example copied"));
                    }}
                    title="Click to copy"
                  >
                    <code className="min-w-0 flex-1 break-all font-mono text-sm text-[var(--text-primary)]">
                      {ex.command}
                    </code>
                    <svg
                      className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated command — always visible at bottom */}
      <div className="border-t border-[var(--content-border)] bg-[var(--sidebar-bg)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Generated Command
          </h3>
          <Button size="sm" variant="primary" onClick={() => void copy()}>
            Copy
          </Button>
        </div>
        <div
          className="cursor-pointer rounded-[0.375em] border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3 font-mono text-base text-[var(--text-primary)] break-all hover:bg-[var(--hover-bg)] transition-colors"
          onClick={() => void copy()}
          title="Click to copy"
        >
          {generatedCommand}
        </div>
      </div>
    </div>
  );
}

export function SfCliReference() {
  const [data, setData] = useState<CliData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = usePersistedState<string>(`${STORAGE_KEY}:search`, "");
  const [selectedCategory, setSelectedCategory] = usePersistedState<string>(
    `${STORAGE_KEY}:category`,
    "",
  );
  const [selectedCommand, setSelectedCommand] = usePersistedState<string>(
    `${STORAGE_KEY}:command`,
    "",
  );
  const [searchFlag, setSearchFlag] = usePersistedState<boolean>(
    `${STORAGE_KEY}:searchFlag`,
    false,
  );
  const [searchDescription, setSearchDescription] = usePersistedState<boolean>(
    `${STORAGE_KEY}:searchDescription`,
    false,
  );
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/sf-cli-reference.json", { signal: controller.signal })
      .then((res) => res.json() as Promise<CliData>)
      .then((json) => {
        setData(json);
        setStatus("ready");
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.categories)
      .map(([name, cmds]) => ({ name, count: cmds.length }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filteredCommands = useMemo(() => {
    if (!data) return [];
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return data.commands.filter((cmd) => {
      if (selectedCategory && cmd.category !== selectedCategory) return false;
      if (terms.length === 0) return true;
      return terms.every((term) => {
        const matchesCommand = cmd.command.toLowerCase().includes(term);
        const matchesFlag = searchFlag && cmd.flags.some((f) => f.flag.toLowerCase().includes(term));
        const matchesDescription = searchDescription && (
          cmd.summary?.toLowerCase().includes(term) ||
          cmd.description?.toLowerCase().includes(term) ||
          cmd.flags.some((f) => f.description?.toLowerCase().includes(term))
        );
        return matchesCommand || matchesFlag || matchesDescription;
      });
    });
  }, [data, search, selectedCategory, searchFlag, searchDescription]);

  const activeCommand = useMemo(
    () => filteredCommands.find((c) => c.command === selectedCommand) ?? filteredCommands[0] ?? null,
    [filteredCommands, selectedCommand],
  );

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading SF CLI reference…
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--danger-color)]">
        Failed to load SF CLI reference. Run{" "}
        <code className="mx-1 font-mono">npm run sfcli-generate-docs</code> to generate it.
      </div>
    );
  }

  const cliVersion = data.cliVersion ?? data.sfCliVersion ?? "unknown";

  return (
    <>
      {ToastComponent}
      <Splitter
        orientation="horizontal"
        defaultSize={28}
        minSize={18}
        maxSize={50}
        storageKey="sfdc-tools:sf-cli:sidebar-size"
        className="h-full"
      >
        {/* Command list + controls */}
        <div className="flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--sidebar-bg)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">SF CLI</span>
              <span className="rounded-full bg-[var(--hover-bg)] border border-[var(--content-border)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                v{cliVersion}
              </span>
            </div>
            <a
              href="https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_unified.htm"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm text-[var(--primary-color)] hover:underline underline-offset-2"
              title="Open Salesforce CLI Docs"
            >
              Docs
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Category + search controls */}
          <div className="flex flex-col gap-2 border-b border-[var(--border-color)] p-2.5">
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-w-0 flex-1 rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1.5 text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--primary-color)] transition-colors"
              >
                <option value="">All ({data.totalCommands})</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {toProperCase(cat.name)} ({cat.count})
                  </option>
                ))}
              </select>
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="min-w-0 flex-1"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label
                className="flex cursor-pointer items-center gap-1.5"
                title="Also search flag names (e.g. --target-org)"
              >
                <input
                  type="checkbox"
                  checked={searchFlag}
                  onChange={(e) => setSearchFlag(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--primary-color)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Search Flags</span>
              </label>
              <label
                className="flex cursor-pointer items-center gap-1.5"
                title="Also search summaries, descriptions, and flag descriptions"
              >
                <input
                  type="checkbox"
                  checked={searchDescription}
                  onChange={(e) => setSearchDescription(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--primary-color)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Search Description</span>
              </label>
              <span className="text-sm text-[var(--text-secondary)]">
                {filteredCommands.length} command{filteredCommands.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Command list */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-4 text-sm text-[var(--text-tertiary)]">No commands found.</div>
            ) : (
              <ul>
                {filteredCommands.map((cmd) => {
                  const isActive = cmd.command === activeCommand?.command;
                  return (
                    <li key={cmd.command}>
                      <button
                        type="button"
                        onClick={() => setSelectedCommand(cmd.command)}
                        className={`w-full cursor-pointer px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-bg)] border-b border-[var(--border-color)] border-l-2 ${
                          isActive
                            ? "border-l-[var(--primary-color)] bg-[var(--hover-bg)]"
                            : "border-l-transparent"
                        }`}
                      >
                        <div
                          className={`font-mono text-sm font-semibold ${
                            isActive ? "text-[var(--primary-color)]" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {cmd.command}
                        </div>
                        <div className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">
                          {cmd.summary}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

          {/* Detail panel */}
          <div className="h-full overflow-hidden bg-[var(--content-color)]">
            {activeCommand ? (
              <CommandDetail key={activeCommand.command} command={activeCommand} onCopy={showToast} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--text-tertiary)]">
                Select a command to view details.
              </div>
            )}
          </div>
      </Splitter>
    </>
  );
}
