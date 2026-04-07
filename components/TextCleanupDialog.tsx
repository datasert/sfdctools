"use client";

import { Button } from "./Button";
import { InputCheckbox } from "./InputCheckbox";
import { Select } from "./Select";
import type { TextCleanupOptions, TextCleanupCaseMode } from "@/lib/text-cleanup";

interface TextCleanupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  options: TextCleanupOptions;
  onChange: (options: TextCleanupOptions) => void;
}

function updateOption(
  options: TextCleanupOptions,
  key: keyof TextCleanupOptions,
  value: boolean | TextCleanupCaseMode,
): TextCleanupOptions {
  return {
    ...options,
    [key]: value,
  };
}

export function TextCleanupDialog({
  isOpen,
  onClose,
  options,
  onChange,
}: TextCleanupDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 cursor-pointer" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[var(--content-color)] rounded-[0.5em] shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col"
          style={{ boxShadow: "0 0 0.625em var(--shadow-color)" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--content-border)] px-4 py-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Text Cleanup</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <InputCheckbox
                label="Sort Lines"
                checked={options.sortLines}
                onChange={(event) =>
                  onChange(updateOption(options, "sortLines", event.target.checked))
                }
              />
              <InputCheckbox
                label="Trim Lines"
                checked={options.trimLines}
                onChange={(event) =>
                  onChange(updateOption(options, "trimLines", event.target.checked))
                }
              />
              <InputCheckbox
                label="Replace Line Break with Space"
                checked={options.replaceLineBreakWithSpace}
                onChange={(event) =>
                  onChange(
                    updateOption(
                      options,
                      "replaceLineBreakWithSpace",
                      event.target.checked,
                    ),
                  )
                }
              />
              <InputCheckbox
                label="Normalize Spaces"
                checked={options.normalizeSpaces}
                onChange={(event) =>
                  onChange(updateOption(options, "normalizeSpaces", event.target.checked))
                }
              />
              <InputCheckbox
                label="Normalize Dashes"
                checked={options.normalizeDashes}
                onChange={(event) =>
                  onChange(updateOption(options, "normalizeDashes", event.target.checked))
                }
              />
              <InputCheckbox
                label="Remove Quotations"
                checked={options.removeQuotations}
                onChange={(event) =>
                  onChange(updateOption(options, "removeQuotations", event.target.checked))
                }
              />
              <div className="pt-2">
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Case Conversion
                </label>
                <Select
                  value={options.caseMode}
                  onChange={(event) =>
                    onChange(
                      updateOption(
                        options,
                        "caseMode",
                        event.target.value as TextCleanupCaseMode,
                      ),
                    )
                  }
                  className="w-full"
                >
                  <option value="none">None</option>
                  <option value="lower">To Lower Case</option>
                  <option value="upper">To Upper Case</option>
                  <option value="title">To Title Case</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--content-border)] px-4 py-3 flex justify-end">
            <Button onClick={onClose} variant="secondary" size="sm">
              Done
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
