"use client";

import { Button } from "./Button";
import { InputCheckbox } from "./InputCheckbox";
import type { JsonCleanupOptions } from "@/lib/json-cleanup";

interface JsonCleanupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  options: JsonCleanupOptions;
  onChange: (options: JsonCleanupOptions) => void;
}

function optionUpdater(
  options: JsonCleanupOptions,
  key: keyof JsonCleanupOptions,
  checked: boolean
): JsonCleanupOptions {
  return { ...options, [key]: checked };
}

export function JsonCleanupDialog({ isOpen, onClose, options, onChange }: JsonCleanupDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 cursor-pointer" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[var(--content-color)] rounded-[0.5em] shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col"
          style={{ boxShadow: "0 0 0.625em var(--shadow-color)" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--content-border)] px-4 py-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">JSON Cleanup</h2>
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
                label="Remove Null/Undefined"
                checked={options.removeNullUndefined}
                onChange={(event) =>
                  onChange(optionUpdater(options, "removeNullUndefined", event.target.checked))
                }
              />
              <InputCheckbox
                label="Remove False"
                checked={options.removeFalse}
                onChange={(event) => onChange(optionUpdater(options, "removeFalse", event.target.checked))}
              />
              <InputCheckbox
                label="Remove Blank"
                checked={options.removeBlank}
                onChange={(event) => onChange(optionUpdater(options, "removeBlank", event.target.checked))}
              />
              <InputCheckbox
                label="Remove Null/Undefined Array Items"
                checked={options.removeNullUndefinedArrayItems}
                onChange={(event) =>
                  onChange(optionUpdater(options, "removeNullUndefinedArrayItems", event.target.checked))
                }
              />
              <InputCheckbox
                label="Remove Blank Array Items"
                checked={options.removeBlankArrayItems}
                onChange={(event) =>
                  onChange(optionUpdater(options, "removeBlankArrayItems", event.target.checked))
                }
              />
              <InputCheckbox
                label="Remove Empty Array"
                checked={options.removeEmptyArray}
                onChange={(event) => onChange(optionUpdater(options, "removeEmptyArray", event.target.checked))}
              />
              <InputCheckbox
                label="Remove Empty Object"
                checked={options.removeEmptyObject}
                onChange={(event) => onChange(optionUpdater(options, "removeEmptyObject", event.target.checked))}
              />
              <InputCheckbox
                label="Sort JSON Fields"
                checked={options.sortJsonFields}
                onChange={(event) => onChange(optionUpdater(options, "sortJsonFields", event.target.checked))}
              />
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
