export type TextCleanupCaseMode = "none" | "lower" | "upper" | "title";

export interface TextCleanupOptions {
  sortLines: boolean;
  trimLines: boolean;
  replaceLineBreakWithSpace: boolean;
  normalizeSpaces: boolean;
  normalizeDashes: boolean;
  removeQuotations: boolean;
  caseMode: TextCleanupCaseMode;
}

export const defaultTextCleanupOptions: TextCleanupOptions = {
  sortLines: false,
  trimLines: false,
  replaceLineBreakWithSpace: false,
  normalizeSpaces: false,
  normalizeDashes: false,
  removeQuotations: false,
  caseMode: "none",
};

function toTitleCase(value: string): string {
  return value.replace(/\S+/g, (word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

export function cleanupText(
  input: string,
  options: TextCleanupOptions,
): string {
  let output = input;

  if (options.sortLines) {
    const hasTrailingNewline = output.endsWith("\n");
    const lines = output.split("\n");
    if (hasTrailingNewline) {
      lines.pop();
    }
    output = lines.sort((left, right) => left.localeCompare(right)).join("\n");
    if (hasTrailingNewline) {
      output += "\n";
    }
  }

  if (options.trimLines) {
    output = output
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  if (options.replaceLineBreakWithSpace) {
    output = output.replace(/\r?\n+/g, " ");
  }

  if (options.normalizeSpaces) {
    output = output.replace(/[^\S\r\n]+/g, " ").trim();
  }

  if (options.normalizeDashes) {
    output = output.replace(/[‐‑‒–—―−]+/g, "-");
  }

  if (options.removeQuotations) {
    output = output.replace(/["'`“”‘’«»]/g, "");
  }

  if (options.caseMode === "lower") {
    output = output.toLowerCase();
  } else if (options.caseMode === "upper") {
    output = output.toUpperCase();
  } else if (options.caseMode === "title") {
    output = toTitleCase(output);
  }

  return output;
}
