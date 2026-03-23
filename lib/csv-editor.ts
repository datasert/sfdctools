import Papa from "papaparse";

export const CSV_EDITOR_STORAGE_KEY = "sfdc-tools:csv-editor";

export type CsvDelimiter = "," | "\t";

export interface CsvEditorRow {
  __id: string;
  [key: string]: string;
}

export interface CsvEditorDocument {
  columns: string[];
  rows: CsvEditorRow[];
  delimiter: CsvDelimiter;
}

export interface CsvReplaceOptions {
  rowScope: "selected" | "all";
  selectedRowIds: string[];
  columns: string[];
  findText: string;
  replaceText: string;
  matchWholeString: boolean;
  caseSensitive: boolean;
}

export interface CsvReplaceResult {
  document: CsvEditorDocument;
  replacements: number;
}

export interface ParsedDelimitedText {
  columns: string[];
  rows: CsvEditorRow[];
  delimiter: CsvDelimiter;
}

const DEFAULT_COLUMNS = ["Name", "Email", "Status"];

export function createEmptyCsvDocument(): CsvEditorDocument {
  return {
    columns: [],
    rows: [],
    delimiter: ",",
  };
}

export function createDefaultCsvDocument(): CsvEditorDocument {
  return {
    columns: DEFAULT_COLUMNS,
    rows: [
      {
        __id: createRowId(),
        Name: "Acme",
        Email: "ops@acme.example",
        Status: "Active",
      },
      {
        __id: createRowId(),
        Name: "Globex",
        Email: "support@globex.example",
        Status: "Pending",
      },
      {
        __id: createRowId(),
        Name: "Initech",
        Email: "team@initech.example",
        Status: "Inactive",
      },
    ],
    delimiter: ",",
  };
}

export function createRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function detectDelimiter(text: string): CsvDelimiter {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  return tabCount > commaCount ? "\t" : ",";
}

export function parseDelimitedText(
  text: string,
  delimiterHint?: CsvDelimiter,
): ParsedDelimitedText {
  const trimmed = text.trim();
  if (!trimmed) {
    return { columns: [], rows: [], delimiter: delimiterHint ?? "," };
  }

  const delimiter = normalizeDelimiter(delimiterHint ?? detectDelimiter(text));
  const parsed = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: "greedy",
  });
  const matrix = parsed.data.filter((row) => row.some((value) => value.length > 0));

  if (matrix.length === 0) {
    return { columns: [], rows: [], delimiter };
  }

  const rawHeaders = matrix[0];
  const width = Math.max(
    rawHeaders.length,
    ...matrix.slice(1).map((row) => row.length),
  );
  const columns = uniquifyHeaders(rawHeaders, width);
  const rows = matrix.slice(1).map((values) => {
    const row: CsvEditorRow = { __id: createRowId() };

    columns.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });

    return row;
  });

  return { columns, rows, delimiter };
}

export function appendRowsFromDelimitedText(
  document: CsvEditorDocument,
  text: string,
  delimiterHint?: CsvDelimiter,
): CsvEditorDocument {
  const trimmed = text.trim();
  if (!trimmed) {
    return document;
  }

  const delimiter = normalizeDelimiter(delimiterHint ?? document.delimiter);
  const parsed = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: "greedy",
  });
  const parsedRows = parsed.data.filter((row) => row.some((value) => value.length > 0));

  if (parsedRows.length === 0) {
    return document;
  }

  const rows = parsedRows.map((values) => {
    const row: CsvEditorRow = { __id: createRowId() };
    document.columns.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });
    return row;
  });

  return {
    ...document,
    rows: [...document.rows, ...rows],
  };
}

export function serializeDelimitedText(
  columns: string[],
  rows: CsvEditorRow[],
  delimiter: CsvDelimiter,
): string {
  const normalizedDelimiter = normalizeDelimiter(delimiter);
  return Papa.unparse(
    {
      fields: columns,
      data: rows.map((row) => columns.map((column) => row[column] ?? "")),
    },
    {
      delimiter: normalizedDelimiter,
      newline: "\r\n",
    },
  );
}

export function parseColumnNames(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function replaceValuesInDocument(
  document: CsvEditorDocument,
  options: CsvReplaceOptions,
): CsvReplaceResult {
  const findText = options.findText;
  if (!findText) {
    return { document, replacements: 0 };
  }

  const columns = options.columns.filter((column) => document.columns.includes(column));
  if (columns.length === 0) {
    return { document, replacements: 0 };
  }

  const rowIds =
    options.rowScope === "selected"
      ? new Set(options.selectedRowIds)
      : null;

  const findNeedle = options.caseSensitive ? findText : findText.toLowerCase();
  let replacements = 0;

  const nextDocument: CsvEditorDocument = {
    ...document,
    rows: document.rows.map((row) => {
      if (rowIds && !rowIds.has(row.__id)) {
        return row;
      }

      let rowChanged = false;
      const nextRow: CsvEditorRow = { ...row };

      columns.forEach((column) => {
        const currentValue = row[column] ?? "";
        const nextValue = replaceInValue(currentValue, findNeedle, options, (count) => {
          replacements += count;
          rowChanged = true;
        });

        if (nextValue !== currentValue) {
          nextRow[column] = nextValue;
        }
      });

      return rowChanged ? nextRow : row;
    }),
  };

  return { document: nextDocument, replacements };
}

function uniquifyHeaders(headers: string[], width: number): string[] {
  const seen = new Map<string, number>();

  return Array.from({ length: width }, (_, index) => {
    const base = (headers[index] ?? "").trim() || `Column ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

function normalizeDelimiter(delimiter: string): CsvDelimiter {
  return delimiter === "," ? "," : "\t";
}

function replaceInValue(
  value: string,
  findNeedle: string,
  options: Pick<CsvReplaceOptions, "matchWholeString" | "caseSensitive" | "replaceText">,
  onReplace: (count: number) => void,
): string {
  if (!findNeedle) {
    return value;
  }

  if (options.matchWholeString) {
    const normalizedValue = options.caseSensitive ? value : value.toLowerCase();
    if (normalizedValue === findNeedle) {
      onReplace(1);
      return options.replaceText;
    }
    return value;
  }

  if (options.caseSensitive) {
    const matches = value.match(new RegExp(escapeRegExp(findNeedle), "g"));
    const matchCount = matches?.length ?? 0;
    if (matchCount > 0) {
      onReplace(matchCount);
      return value.replace(
        new RegExp(escapeRegExp(findNeedle), "g"),
        options.replaceText,
      );
    }
    return value;
  }

  const regex = new RegExp(escapeRegExp(findNeedle), "gi");
  const matches = value.match(regex);
  const matchCount = matches?.length ?? 0;
  if (matchCount > 0) {
    onReplace(matchCount);
    return value.replace(regex, options.replaceText);
  }

  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
