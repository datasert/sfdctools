/**
 * Generate Salesforce IN clause string from a list of values
 */

export interface InClauseOptions {
  dedupe: boolean;
  sorted: boolean;
  maxValuesPerLine: number;
  quoted: boolean;
  splitAfter?: number; // If specified, split into multiple IN clauses after this many values
}

/**
 * Escape single quotes in a string
 */
function escapeQuotes(value: string): string {
  return value.replace(/'/g, "\\'");
}

/**
 * Generate IN clause string from values
 */
export function generateInClause(
  input: string,
  options: InClauseOptions
): { output: string; error: string | null } {
  const { dedupe, sorted, maxValuesPerLine, quoted, splitAfter } = options;

  if (!input.trim()) {
    return { output: '', error: null };
  }

  try {
    // Parse input - support both line-separated and comma-separated values
    let values: string[] = [];
    
    // Try comma-separated first, then fall back to line-separated
    if (input.includes(',') && !input.includes('\n')) {
      // Comma-separated
      values = input.split(',').map(v => v.trim()).filter(v => v.length > 0);
    } else {
      // Line-separated (or mixed)
      values = input
        .split(/[,\n]/)
        .map(v => v.trim())
        .filter(v => v.length > 0);
    }

    if (values.length === 0) {
      return { output: '', error: null };
    }

    // Dedupe if requested
    if (dedupe) {
      values = Array.from(new Set(values));
    }

    // Sort if requested
    if (sorted) {
      values = [...values].sort();
    }

    // Format values with quotes and escaping if needed
    const formattedValues = values.map(value => {
      const escaped = quoted ? escapeQuotes(value) : value;
      return quoted ? `'${escaped}'` : escaped;
    });

    // If splitAfter is specified, split into chunks
    if (splitAfter && splitAfter > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < formattedValues.length; i += splitAfter) {
        chunks.push(formattedValues.slice(i, i + splitAfter));
      }

      // Format each chunk
      const formattedChunks = chunks.map(chunk => {
        // Group values into lines based on maxValuesPerLine within each chunk
        const lines: string[] = [];
        for (let i = 0; i < chunk.length; i += maxValuesPerLine) {
          const lineValues = chunk.slice(i, i + maxValuesPerLine);
          const line = lineValues.join(', ');
          // Add comma if not the last line of the chunk
          const isLastLine = i + maxValuesPerLine >= chunk.length;
          lines.push(isLastLine ? line : line + ',');
        }
        return lines.join('\n');
      });

      // Join chunks with a single blank line
      const output = formattedChunks.join('\n\n');
      return { output, error: null };
    }

    // Group values into lines based on maxValuesPerLine
    const lines: string[] = [];
    for (let i = 0; i < formattedValues.length; i += maxValuesPerLine) {
      const lineValues = formattedValues.slice(i, i + maxValuesPerLine);
      const line = lineValues.join(', ');
      // Add comma if not the last line
      const isLastLine = i + maxValuesPerLine >= formattedValues.length;
      lines.push(isLastLine ? line : line + ',');
    }

    // Join lines with line breaks - all lines have consistent formatting
    const output = lines.join('\n');

    return { output, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      output: '',
      error: errorMessage,
    };
  }
}
