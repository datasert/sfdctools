"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { CopyText } from "@/components/CopyText";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import type {
  SldsCssClassDeclaration,
  SldsCssClassItem,
  SldsCssPreviewType,
} from "@/lib/slds-css-classes";

interface SldsCssClassesProps {
  initialClasses: SldsCssClassItem[];
  utilities: string[];
  previewTypes: SldsCssPreviewType[];
}

const STORAGE_KEY = "sfdc-tools:slds-css-classes";

function utilityLabel(value: string): string {
  return value
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function firstDeclarationValue(
  declarations: SldsCssClassDeclaration[],
  matcher: (property: string) => boolean
): string | null {
  const match = declarations.find((decl) => matcher(decl.property.toLowerCase()));
  return match ? match.value : null;
}

function extractColorValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim();
  if (/^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(normalized)) {
    return normalized;
  }
  if (/^(rgb|hsl)a?\(/i.test(normalized)) {
    return normalized;
  }
  return null;
}

function ClassPreview({ item }: { item: SldsCssClassItem }) {
  if (item.previewType === "Color") {
    const colorValue = extractColorValue(
      firstDeclarationValue(item.declarations, (property) => property.includes("color"))
    );
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-2">
        {colorValue ? (
          <div
            className="h-full w-full rounded"
            style={{ background: colorValue }}
            title={colorValue}
          />
        ) : (
          <div className="flex h-full items-center rounded border border-dashed border-[var(--content-border)] bg-[var(--content-color)] px-2">
            <div className="h-7 w-7 rounded bg-[var(--primary-color)] opacity-80" />
            <div className="ml-2 h-7 w-7 rounded bg-[var(--primary-color)] opacity-45" />
            <div className="ml-auto text-xs text-[var(--text-secondary)]">Color</div>
          </div>
        )}
      </div>
    );
  }

  if (item.previewType === "Spacing") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center justify-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-3">
          <div className="h-8 w-8 rounded bg-[var(--primary-color)]/70" />
        </div>
      </div>
    );
  }

  if (item.previewType === "Typography") {
    const fontWeight = firstDeclarationValue(item.declarations, (property) => property === "font-weight");
    const style: { fontWeight?: number } = {};
    const parsedWeight = fontWeight ? Number.parseInt(fontWeight, 10) : Number.NaN;
    if (Number.isFinite(parsedWeight)) {
      style.fontWeight = parsedWeight;
    }

    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="line-clamp-2 h-full overflow-hidden rounded border border-[var(--content-border)] bg-[var(--content-color)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          <span style={style}>SLDS utility class preview text</span>
        </div>
      </div>
    );
  }

  if (item.previewType === "Border") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="h-full w-full rounded border-2 border-solid border-[var(--text-secondary)] bg-[var(--content-color)]" />
      </div>
    );
  }

  if (item.previewType === "Shadow") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div
          className="h-full w-full rounded bg-[var(--content-color)]"
          style={{ boxShadow: "0 0.35rem 0.85rem rgba(24, 24, 24, 0.2)" }}
        />
      </div>
    );
  }

  if (item.previewType === "Sizing") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-2">
          <div className="h-3 rounded bg-[var(--primary-color)]" style={{ width: "68%" }} />
        </div>
      </div>
    );
  }

  if (item.previewType === "Layout") {
    return (
      <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
        <div className="flex h-full items-center rounded border border-[var(--content-border)] bg-[var(--content-color)] px-2">
          <div className="h-6 w-6 rounded bg-[var(--primary-color)]/70" />
          <div className="mx-1.5 h-6 w-6 rounded bg-[var(--primary-color)]/55" />
          <div className="h-6 w-6 rounded bg-[var(--primary-color)]/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 rounded-md border border-[var(--content-border)] bg-[var(--content-faded-color)] p-3">
      <div className="flex h-full items-center justify-center rounded border border-dashed border-[var(--content-border)] bg-[var(--content-color)] text-xs text-[var(--text-tertiary)]">
        Generic Preview
      </div>
    </div>
  );
}

function ClassCard({
  item,
  onCopy,
}: {
  item: SldsCssClassItem;
  onCopy: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyWithFallback = (value: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const didCopy = document.execCommand("copy");
    document.body.removeChild(textarea);
    return didCopy;
  };

  const copyText = async (value: string, message: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!copyWithFallback(value)) {
        onCopy("Failed to copy");
        return;
      }
      onCopy(message);
    } catch {
      onCopy(copyWithFallback(value) ? message : "Failed to copy");
    }
  };

  const usage = `<div class="${item.className}">...</div>`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        setCopied(true);
        void copyText(item.className, "Copied class name");
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setCopied(true);
          void copyText(item.className, "Copied class name");
        }
      }}
      className="group/card cursor-pointer rounded-[0.5em] bg-[var(--content-color)] p-3 transition-all hover:bg-[var(--hover-bg)]"
      style={{ boxShadow: "0 0 0.625em var(--shadow-color)" }}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <CopyText
            text={item.className}
            className="max-w-full p-0 text-sm font-semibold text-[var(--text-primary)] hover:bg-transparent"
            onCopied={() => {
              onCopy("Copied class name");
            }}
          />
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="rounded border border-[var(--content-border)] bg-[var(--content-faded-color)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--text-secondary)]">
              {utilityLabel(item.utility)}
            </span>
            <span className="rounded border border-[var(--content-border)] bg-[var(--content-faded-color)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--text-secondary)]">
              {item.previewType}
            </span>
          </div>
        </div>
        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-[var(--text-tertiary)]">
          {copied ? (
            <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/card:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      </div>

      <ClassPreview item={item} />

      {item.summary ? (
        <div className="mt-2.5 text-xs text-[var(--text-secondary)] line-clamp-2">{item.summary}</div>
      ) : null}

      <div className="mt-2.5 rounded border border-[var(--content-border)] bg-[var(--content-faded-color)] px-2 py-1.5 font-mono text-xs text-[var(--text-secondary)]">
        {item.declarations.length === 0 ? (
          <div>declarations unavailable</div>
        ) : (
          item.declarations.slice(0, 3).map((decl) => (
            <div key={`${item.className}-${decl.property}`}>
              {decl.property}: {decl.value};
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void copyText(usage, "Copied usage");
        }}
        className="group/usage mt-2.5 w-full rounded border border-[var(--content-border)] bg-[var(--content-faded-color)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--hover-bg)] cursor-pointer"
      >
        <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Usage
        </div>
        <div className="font-mono text-xs text-[var(--text-primary)] break-all">{usage}</div>
      </button>
    </div>
  );
}

export function SldsCssClasses({
  initialClasses,
  utilities,
  previewTypes,
}: SldsCssClassesProps) {
  const { showToast, ToastComponent } = useToast();
  const [search, setSearch] = usePersistedState<string>(`${STORAGE_KEY}:search`, "");
  const [selectedUtilities, setSelectedUtilities] = usePersistedState<string[]>(
    `${STORAGE_KEY}:utilities`,
    []
  );
  const [selectedTypes, setSelectedTypes] = usePersistedState<SldsCssPreviewType[]>(
    `${STORAGE_KEY}:types`,
    []
  );

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialClasses.filter((item) => {
      const utilityMatch =
        selectedUtilities.length === 0 || selectedUtilities.includes(item.utility);
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.previewType);
      if (!utilityMatch || !typeMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.className.toLowerCase().includes(query) ||
        item.utility.toLowerCase().includes(query) ||
        item.previewType.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.declarations.some(
          (decl) =>
            decl.property.toLowerCase().includes(query) ||
            decl.value.toLowerCase().includes(query)
        )
      );
    });
  }, [initialClasses, search, selectedTypes, selectedUtilities]);

  const toggleUtility = (utility: string) => {
    setSelectedUtilities((current) =>
      current.includes(utility)
        ? current.filter((value) => value !== utility)
        : [...current, utility]
    );
  };

  const toggleType = (type: SldsCssPreviewType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((value) => value !== type) : [...current, type]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedUtilities([]);
    setSelectedTypes([]);
  };

  return (
    <>
      {ToastComponent}
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border-color)] bg-[var(--card-bg)] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedUtilities([]);
                }}
                className={`rounded-[0.375em] border px-2 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  selectedUtilities.length === 0
                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)]"
                    : "border-[var(--input-border)] bg-[var(--input-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                All Utilities
              </button>
              {utilities.map((utility) => {
                const active = selectedUtilities.includes(utility);
                return (
                  <button
                    key={utility}
                    type="button"
                    onClick={() => toggleUtility(utility)}
                    className={`rounded-[0.375em] border px-2 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)]"
                        : "border-[var(--input-border)] bg-[var(--input-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {utilityLabel(utility)}
                  </button>
                );
              })}
            </div>

            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Search classes..."
              className="w-52 flex-shrink-0"
            />
            <div className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
              {filteredClasses.length} class{filteredClasses.length !== 1 ? "es" : ""}
            </div>
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedTypes([]);
              }}
              className={`rounded-[0.375em] border px-2 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                selectedTypes.length === 0
                  ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)]"
                  : "border-[var(--input-border)] bg-[var(--input-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              }`}
            >
              All Types
            </button>
            {previewTypes.map((type) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-[0.375em] border px-2 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)]"
                      : "border-[var(--input-border)] bg-[var(--input-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  {type}
                </button>
              );
            })}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredClasses.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
              No classes found
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2.5">
              {filteredClasses.map((item) => (
                <ClassCard key={item.className} item={item} onCopy={showToast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
