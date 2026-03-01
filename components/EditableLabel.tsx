"use client";

import { KeyboardEvent, useState } from "react";

interface EditableLabelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  textClassName?: string;
}

export function EditableLabel({
  value,
  onChange,
  placeholder = "Edit label",
  className = "",
  inputClassName = "",
  textClassName = "",
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    setIsEditing(false);
    onChange(draft);
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  if (isEditing) {
    return (
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        autoFocus
        placeholder={placeholder}
        className={`rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2 py-1 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] transition-colors ${inputClassName} ${className}`}
      />
    );
  }

  const displayText = value.trim() || placeholder;

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      className={`rounded-[0.375em] border border-transparent px-2 py-1 text-left text-sm font-semibold hover:border-[var(--content-border)] hover:bg-[var(--hover-bg)] transition-colors cursor-text ${textClassName} ${className}`}
      title="Click to edit"
    >
      {displayText}
    </button>
  );
}
