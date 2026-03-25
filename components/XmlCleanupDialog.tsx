"use client";

import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { InputCheckbox } from "./InputCheckbox";
import type { XmlCleanupOptions } from "@/lib/xml-cleanup";

interface XmlCleanupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  options: XmlCleanupOptions;
  onChange: (options: XmlCleanupOptions) => void;
}

function optionUpdater(
  options: XmlCleanupOptions,
  key: keyof XmlCleanupOptions,
  checked: boolean,
): XmlCleanupOptions {
  return { ...options, [key]: checked };
}

function textUpdater(
  options: XmlCleanupOptions,
  key: keyof XmlCleanupOptions,
  value: string,
): XmlCleanupOptions {
  return { ...options, [key]: value };
}

export function XmlCleanupDialog({
  isOpen,
  onClose,
  options,
  onChange,
}: XmlCleanupDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="XML Cleanup"
      maxWidthClassName="max-w-lg"
      footer={
        <Button onClick={onClose} variant="secondary" size="sm">
          Done
        </Button>
      }
    >
      <div className="space-y-2">
        <InputCheckbox
          label="Trim Text Nodes"
          checked={options.trimTextNodes}
          onChange={(event) =>
            onChange(
              optionUpdater(options, "trimTextNodes", event.target.checked),
            )
          }
        />
        <InputCheckbox
          label="Remove Comments"
          checked={options.removeComments}
          onChange={(event) =>
            onChange(
              optionUpdater(options, "removeComments", event.target.checked),
            )
          }
        />
        <InputCheckbox
          label="Remove Empty Nodes"
          checked={options.removeEmptyNodes}
          onChange={(event) =>
            onChange(
              optionUpdater(options, "removeEmptyNodes", event.target.checked),
            )
          }
        />
        <InputCheckbox
          label="Sort Attributes"
          checked={options.sortAttributes}
          onChange={(event) =>
            onChange(
              optionUpdater(options, "sortAttributes", event.target.checked),
            )
          }
        />
        <InputCheckbox
          label="Sort Tags"
          checked={options.sortTags}
          onChange={(event) =>
            onChange(optionUpdater(options, "sortTags", event.target.checked))
          }
        />
        <InputCheckbox
          label="Sort Nodes By Path"
          checked={options.sortNodes}
          onChange={(event) =>
            onChange(optionUpdater(options, "sortNodes", event.target.checked))
          }
        />
        <div className="pl-2">
          <p className="text-sm text-[var(--text-secondary)]">
            Use a path like <code>root/item/key</code> to sort sibling
            <code> item </code>
            nodes under <code>root</code>&nbsp;by each node&apos;s
            <code> key </code>
            child value. Add one rule per line. Comma-separated rules still
            work.
          </p>
          <textarea
            value={options.sortNodePath}
            onChange={(event) =>
              onChange(textUpdater(options, "sortNodePath", event.target.value))
            }
            placeholder={`root/item/key\nroot/group/name`}
            disabled={!options.sortNodes}
            rows={4}
            className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>
    </Dialog>
  );
}
