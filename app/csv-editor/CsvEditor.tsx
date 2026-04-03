"use client";

import { useRef, useState } from "react";
import { AgGridReact, type CustomHeaderProps } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
} from "ag-grid-community";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import { InputCheckbox } from "@/components/InputCheckbox";
import { MenuButton } from "@/components/MenuButton";
import { Select } from "@/components/Select";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { useToast } from "@/components/Toast";
import { usePersistedState } from "@/lib/use-persisted-state";
import {
  appendRowsFromDelimitedText,
  createDefaultCsvDocument,
  createEmptyCsvDocument,
  createRowId,
  CSV_EDITOR_STORAGE_KEY,
  parseColumnNames,
  parseDelimitedText,
  replaceValuesInDocument,
  serializeDelimitedText,
  type CsvDelimiter,
  type CsvEditorDocument,
  type CsvEditorRow,
} from "@/lib/csv-editor";

ModuleRegistry.registerModules([AllCommunityModule]);

const gridTheme = themeQuartz.withParams({
  accentColor: "#196EBD",
  backgroundColor: "var(--content-color)",
  borderColor: "var(--content-border)",
  foregroundColor: "var(--text-primary)",
  headerBackgroundColor: "var(--content-faded-color)",
  headerTextColor: "var(--text-primary)",
  wrapperBorderRadius: "8px",
});

type ColumnInsertPosition = "start" | "end" | "at";
type RowInsertPosition = "start" | "end" | "row";
type FillTargetRows = "selected" | "all";
type CopyRangeRows = "selected" | "all";
type FindReplaceRows = "selected" | "all";

export function CsvEditor() {
  const [document, setDocument] = usePersistedState<CsvEditorDocument>(
    CSV_EDITOR_STORAGE_KEY,
    createEmptyCsvDocument(),
  );
  const [selectedRowCount, setSelectedRowCount] = useState(0);

  const [isAddColumnsOpen, setIsAddColumnsOpen] = useState(false);
  const [isDeleteColumnsOpen, setIsDeleteColumnsOpen] = useState(false);
  const [isFillSelectionOpen, setIsFillSelectionOpen] = useState(false);
  const [isAddRowsOpen, setIsAddRowsOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isCopyRangeOpen, setIsCopyRangeOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  const [newColumnsInput, setNewColumnsInput] = useState("");
  const [columnsInput, setColumnsInput] = useState("");
  const [columnInsertPosition, setColumnInsertPosition] =
    useState<ColumnInsertPosition>("end");
  const [columnAtTarget, setColumnAtTarget] = useState("");
  const [columnsToDelete, setColumnsToDelete] = useState<string[]>([]);

  const [fillValue, setFillValue] = useState("");
  const [fillTargetColumns, setFillTargetColumns] = useState<string[]>([]);
  const [fillTargetRows, setFillTargetRows] =
    useState<FillTargetRows>("selected");
  const [rowFilterText, setRowFilterText] = useState("");
  const [columnFilterText, setColumnFilterText] = useState("");
  const [copyRangeFormat, setCopyRangeFormat] = useState<CsvDelimiter>(",");
  const [copyRangeRows, setCopyRangeRows] = useState<CopyRangeRows>("selected");
  const [copyRangeColumns, setCopyRangeColumns] = useState<string[]>([]);
  const [findReplaceRows, setFindReplaceRows] =
    useState<FindReplaceRows>("selected");
  const [findReplaceColumns, setFindReplaceColumns] = useState<string[]>([]);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchWholeString, setMatchWholeString] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const [rowsToInsert, setRowsToInsert] = useState(1);
  const [rowInsertPosition, setRowInsertPosition] =
    useState<RowInsertPosition>("end");
  const [rowInsertNumber, setRowInsertNumber] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridApiRef = useRef<GridApi<CsvEditorRow> | null>(null);
  const { showToast, ToastComponent } = useToast();

  const copyColumnValues = async (columnId: string, uniqueOnly: boolean) => {
    const values = getColumnValues(
      gridApiRef.current,
      document.rows,
      columnId,
      uniqueOnly,
    );

    try {
      await navigator.clipboard.writeText(values.join("\n"));
      showToast(
        uniqueOnly ? "Unique column values copied." : "Column values copied.",
        "success",
      );
    } catch {
      showToast("Clipboard write failed.", "error");
    }
  };

  const columnDefs: ColDef<CsvEditorRow>[] = [
    {
      colId: "__rowNumber",
      headerName: "#",
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      editable: false,
      sortable: false,
      filter: false,
      resizable: false,
      width: 72,
      minWidth: 72,
      maxWidth: 72,
      pinned: "left",
      suppressMovable: true,
    },
    ...document.columns.map((column) => ({
      field: column,
      headerName: column,
      hide: !matchesAnyPart(column, columnFilterText),
      headerComponent: CsvHeaderMenu,
      headerComponentParams: {
        onCopyColumnValues: copyColumnValues,
      },
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 140,
      width: 180,
    })),
  ];

  const rowSelection = { mode: "multiRow" as const };
  const rowFilterParts = splitFilterParts(rowFilterText);

  const handleGridReady = (event: GridReadyEvent<CsvEditorRow>) => {
    gridApiRef.current = event.api;
    setSelectedRowCount(0);
  };

  const syncGridRowChange = () => {
    const api = gridApiRef.current;
    if (!api) {
      return;
    }

    const nextRows: CsvEditorRow[] = [];
    api.forEachNode((node) => {
      if (node.data) {
        nextRows.push(node.data);
      }
    });

    setDocument((current) => ({
      ...current,
      rows: nextRows,
    }));
  };

  const replaceDocument = (nextDocument: CsvEditorDocument) => {
    setDocument(nextDocument);
    gridApiRef.current?.deselectAll();
    setSelectedRowCount(0);
  };

  const loadText = (text: string, sourceLabel: string) => {
    const parsed = parseDelimitedText(text);
    if (parsed.columns.length === 0) {
      showToast("No rows found in the imported text.", "warn");
      return;
    }

    replaceDocument(parsed);
    showToast(
      `Loaded ${parsed.rows.length} rows from ${sourceLabel}.`,
      "success",
    );
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    loadText(await file.text(), file.name);
    event.target.value = "";
  };

  const loadFromClipboard = async () => {
    try {
      loadText(await navigator.clipboard.readText(), "clipboard");
    } catch {
      showToast("Clipboard access failed.", "error");
    }
  };

  const appendClipboardRows = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const nextDocument = appendRowsFromDelimitedText(document, text);
      if (nextDocument.rows.length === document.rows.length) {
        showToast("No rows found in clipboard text.", "warn");
        return;
      }

      replaceDocument(nextDocument);
      showToast("Rows appended from clipboard.", "success");
    } catch {
      showToast("Clipboard access failed.", "error");
    }
  };

  const clearGrid = () => {
    replaceDocument({
      columns: document.columns,
      rows: [],
      delimiter: document.delimiter,
    });
    showToast("Rows cleared.", "success");
  };

  const openNewDialog = () => {
    setNewColumnsInput("");
    setIsNewDialogOpen(true);
  };

  const createNewDocument = () => {
    const columns = parseColumnNames(newColumnsInput);

    replaceDocument({
      ...createEmptyCsvDocument(),
      columns,
    });
    setIsNewDialogOpen(false);
    showToast(
      columns.length > 0
        ? `Started a new sheet with ${columns.length} column(s).`
        : "Started a new empty sheet.",
      "success",
    );
  };

  const resetSample = () => {
    replaceDocument(createDefaultCsvDocument());
    showToast("Sample data restored.", "success");
  };

  const openAddColumnsDialog = () => {
    setColumnsInput("");
    setColumnInsertPosition("end");
    setColumnAtTarget(document.columns[0] ?? "");
    setIsAddColumnsOpen(true);
  };

  const openDeleteColumnsDialog = () => {
    setColumnsToDelete([]);
    setIsDeleteColumnsOpen(true);
  };

  const openFillSelectionDialog = () => {
    setFillValue("");
    setFillTargetColumns([]);
    setFillTargetRows("selected");
    setIsFillSelectionOpen(true);
  };

  const openAddRowsDialog = () => {
    setRowsToInsert(1);
    setRowInsertPosition("end");
    setRowInsertNumber(Math.max(1, document.rows.length + 1));
    setIsAddRowsOpen(true);
  };

  const openCopyRangeDialog = () => {
    setCopyRangeFormat(",");
    setCopyRangeRows("selected");
    setCopyRangeColumns([...document.columns]);
    setIsCopyRangeOpen(true);
  };

  const openFindReplaceDialog = () => {
    setFindReplaceRows(selectedRowCount > 0 ? "selected" : "all");
    setFindReplaceColumns([...document.columns]);
    setFindText("");
    setReplaceText("");
    setMatchWholeString(true);
    setCaseSensitive(false);
    setIsFindReplaceOpen(true);
  };

  const addColumns = () => {
    const requestedColumns = parseColumnNames(columnsInput);
    if (requestedColumns.length === 0) {
      showToast("Enter one or more column names.", "warn");
      return;
    }

    const seen = new Set(document.columns);
    const uniqueColumns = requestedColumns.filter(
      (column) => !seen.has(column),
    );
    if (uniqueColumns.length === 0) {
      showToast("All listed columns already exist.", "warn");
      return;
    }

    const insertIndex = getColumnInsertIndex(
      document.columns,
      columnInsertPosition,
      columnAtTarget,
    );

    setDocument((current) => {
      const nextColumns = [
        ...current.columns.slice(0, insertIndex),
        ...uniqueColumns,
        ...current.columns.slice(insertIndex),
      ];

      return {
        ...current,
        columns: nextColumns,
        rows: current.rows.map((row) => {
          const nextRow = { ...row };
          uniqueColumns.forEach((column) => {
            nextRow[column] = "";
          });
          return nextRow;
        }),
      };
    });

    setIsAddColumnsOpen(false);
    showToast(`Added ${uniqueColumns.length} column(s).`, "success");
  };

  const removeColumns = () => {
    if (columnsToDelete.length === 0) {
      showToast("Select one or more columns to delete.", "warn");
      return;
    }

    setDocument((current) => {
      const remainingColumns = current.columns.filter(
        (column) => !columnsToDelete.includes(column),
      );

      return {
        ...current,
        columns: remainingColumns,
        rows: current.rows.map((row) => {
          const nextRow: CsvEditorRow = { __id: row.__id };
          remainingColumns.forEach((column) => {
            nextRow[column] = row[column] ?? "";
          });
          return nextRow;
        }),
      };
    });

    setIsDeleteColumnsOpen(false);
    showToast(`Removed ${columnsToDelete.length} column(s).`, "success");
  };

  const addRows = () => {
    const count = Math.max(1, Number(rowsToInsert) || 1);
    const insertIndex = getRowInsertIndex(
      document.rows.length,
      rowInsertPosition,
      rowInsertNumber,
    );
    const newRows = Array.from({ length: count }, () => {
      const row: CsvEditorRow = { __id: createRowId() };
      document.columns.forEach((column) => {
        row[column] = "";
      });
      return row;
    });

    setDocument((current) => ({
      ...current,
      rows: [
        ...current.rows.slice(0, insertIndex),
        ...newRows,
        ...current.rows.slice(insertIndex),
      ],
    }));

    setIsAddRowsOpen(false);
    showToast(`Inserted ${count} row(s).`, "success");
  };

  const removeSelectedRows = () => {
    const selectedIds = new Set(
      (gridApiRef.current?.getSelectedRows() ?? []).map((row) => row.__id),
    );

    if (selectedIds.size === 0) {
      showToast("Select one or more rows first.", "warn");
      return;
    }

    setDocument((current) => ({
      ...current,
      rows: current.rows.filter((row) => !selectedIds.has(row.__id)),
    }));
    gridApiRef.current?.deselectAll();
    setSelectedRowCount(0);
    showToast(`Removed ${selectedIds.size} row(s).`, "success");
  };

  const applyFillSelection = (value: string) => {
    const selectedIds =
      fillTargetRows === "selected"
        ? new Set(
            (gridApiRef.current?.getSelectedRows() ?? []).map(
              (row) => row.__id,
            ),
          )
        : new Set(document.rows.map((row) => row.__id));

    if (selectedIds.size === 0) {
      showToast("Select one or more rows first.", "warn");
      return;
    }

    const validColumns = fillTargetColumns.filter((column) =>
      document.columns.includes(column),
    );
    if (validColumns.length === 0) {
      showToast("Select at least one column to fill.", "warn");
      return;
    }

    setDocument((current) => ({
      ...current,
      rows: current.rows.map((row) => {
        if (!selectedIds.has(row.__id)) {
          return row;
        }

        const nextRow = { ...row };
        validColumns.forEach((column) => {
          nextRow[column] = value;
        });
        return nextRow;
      }),
    }));

    setIsFillSelectionOpen(false);
    showToast(
      `Updated ${selectedIds.size} row(s) across ${validColumns.length} column(s).`,
      "success",
    );
  };

  const copyTableToClipboard = async (
    delimiter: CsvDelimiter,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(
        serializeDelimitedText(document.columns, document.rows, delimiter),
      );
      showToast(`Copied as ${label}.`, "success");
    } catch {
      showToast("Clipboard write failed.", "error");
    }
  };

  const copySelectedRangeToClipboard = async () => {
    const columns = copyRangeColumns.filter((column) =>
      document.columns.includes(column),
    );
    if (columns.length === 0) {
      showToast("Select at least one column to copy.", "warn");
      return;
    }

    const selectedIds =
      copyRangeRows === "selected"
        ? new Set(
            (gridApiRef.current?.getSelectedRows() ?? []).map(
              (row) => row.__id,
            ),
          )
        : null;

    if (
      copyRangeRows === "selected" &&
      (!selectedIds || selectedIds.size === 0)
    ) {
      showToast("Select one or more rows first.", "warn");
      return;
    }

    const rows =
      copyRangeRows === "selected"
        ? document.rows.filter((row) => selectedIds?.has(row.__id))
        : document.rows;

    try {
      await navigator.clipboard.writeText(
        serializeDelimitedText(columns, rows, copyRangeFormat),
      );
      setIsCopyRangeOpen(false);
      showToast("Range copied to clipboard.", "success");
    } catch {
      showToast("Clipboard write failed.", "error");
    }
  };

  const applyFindReplace = () => {
    const columns = findReplaceColumns.filter((column) =>
      document.columns.includes(column),
    );
    if (columns.length === 0) {
      showToast("Select at least one column to replace in.", "warn");
      return;
    }

    const selectedRowIds =
      findReplaceRows === "selected"
        ? (gridApiRef.current?.getSelectedRows() ?? []).map((row) => row.__id)
        : [];

    if (findReplaceRows === "selected" && selectedRowIds.length === 0) {
      showToast("Select one or more rows first.", "warn");
      return;
    }

    const result = replaceValuesInDocument(document, {
      rowScope: findReplaceRows,
      selectedRowIds,
      columns,
      findText,
      replaceText,
      matchWholeString,
      caseSensitive,
    });

    if (result.replacements === 0) {
      showToast("No matches found.", "warn");
      return;
    }

    setDocument(result.document);
    setIsFindReplaceOpen(false);
    showToast(`Replaced ${result.replacements} value(s).`, "success");
  };

  const downloadTable = (delimiter: CsvDelimiter, label: string) => {
    const serialized = serializeDelimitedText(
      document.columns,
      document.rows,
      delimiter,
    );
    const blob = new Blob([serialized], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `csv-editor-export${delimiter === "\t" ? ".tsv" : ".csv"}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded as ${label}.`, "success");
  };

  return (
    <>
      {ToastComponent}

      <div className="flex h-full min-h-0 flex-col font-mono">
        <SettingsBar className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SettingsGroup className="flex-wrap">
              <Button size="sm" onClick={openNewDialog}>
                New
              </Button>
              <MenuButton label="Open">
                <MenuItem onClick={openFilePicker}>Open File</MenuItem>
                <MenuItem onClick={loadFromClipboard}>Open Clipboard</MenuItem>
                <MenuItem onClick={appendClipboardRows}>
                  Append Clipboard Rows
                </MenuItem>
                <MenuItem onClick={resetSample}>Open Sample</MenuItem>
              </MenuButton>
            </SettingsGroup>

            <SettingsGroup className="flex-wrap">
              <MenuButton label="Copy">
                <MenuItem onClick={() => copyTableToClipboard(",", "CSV")}>
                  Copy as CSV
                </MenuItem>
                <MenuItem
                  onClick={() => copyTableToClipboard("\t", "Excel (TSV)")}
                >
                  Copy as Excel (TSV)
                </MenuItem>
                <MenuItem onClick={openCopyRangeDialog}>Copy Range</MenuItem>
              </MenuButton>

              <MenuButton label="Export">
                <MenuItem onClick={() => downloadTable(",", "CSV")}>
                  Export as CSV
                </MenuItem>
                <MenuItem onClick={() => downloadTable("\t", "Excel (TSV)")}>
                  Export as Excel (TSV)
                </MenuItem>
              </MenuButton>
            </SettingsGroup>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SettingsGroup className="flex-wrap">
              <Button onClick={openAddRowsDialog} variant="secondary">
                Add Rows
              </Button>
              <MenuButton label="Delete Rows">
                <MenuItem onClick={removeSelectedRows}>
                  {selectedRowCount} Selected Rows
                </MenuItem>
                <MenuItem onClick={clearGrid}>All Rows</MenuItem>
              </MenuButton>
              <Button size="sm" onClick={openAddColumnsDialog}>
                Add Columns
              </Button>
              <Button size="sm" onClick={openDeleteColumnsDialog}>
                Delete Columns
              </Button>
              <Button size="sm" onClick={openFillSelectionDialog}>
                Fill
              </Button>
              <Button size="sm" onClick={openFindReplaceDialog}>
                Find / Replace
              </Button>
            </SettingsGroup>

            <SettingsGroup className="ml-auto flex-wrap">
              <Input
                value={rowFilterText}
                onChange={(event) => setRowFilterText(event.target.value)}
                placeholder="Filter Rows"
                className="w-40 font-mono"
              />
              <Input
                value={columnFilterText}
                onChange={(event) => setColumnFilterText(event.target.value)}
                placeholder="Filter Cols"
                className="w-40 font-mono"
              />
            </SettingsGroup>
          </div>

          <div className="flex justify-end text-xs text-[var(--text-secondary)]">
            {document.rows.length} rows ({selectedRowCount} selected),{" "}
            {document.columns.length} columns
          </div>
        </SettingsBar>

        <div className="min-h-0 flex-1 bg-[var(--background)]">
          <div
            className="h-full min-h-0 overflow-hidden rounded-lg border border-[var(--content-border)] bg-[var(--content-color)] font-mono"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {document.columns.length === 0 ? (
              <div className="flex h-full min-h-[16rem] items-center justify-center px-6 text-center">
                <div className="max-w-md space-y-2">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    Empty CSV
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Open a file, paste from clipboard, open sample data, or add
                    columns and rows to start editing.
                  </p>
                </div>
              </div>
            ) : (
              <AgGridReact<CsvEditorRow>
                theme={gridTheme}
                rowData={document.rows}
                columnDefs={columnDefs}
                defaultColDef={{
                  editable: true,
                  sortable: true,
                  resizable: true,
                  filter: true,
                  filterParams: {
                    buttons: ["reset", "apply"],
                    closeOnApply: true,
                  },
                }}
                getRowId={(params) => params.data.__id}
                onGridReady={handleGridReady}
                isExternalFilterPresent={() => rowFilterParts.length > 0}
                doesExternalFilterPass={(node) =>
                  matchesAnyRowPart(node.data, document.columns, rowFilterParts)
                }
                onCellValueChanged={syncGridRowChange}
                onSelectionChanged={() =>
                  setSelectedRowCount(
                    gridApiRef.current?.getSelectedRows().length ?? 0,
                  )
                }
                onColumnResized={() => gridApiRef.current?.refreshCells()}
                animateRows={false}
                suppressColumnMoveAnimation
                rowSelection={rowSelection}
                suppressRowClickSelection={false}
                maintainColumnOrder
                stopEditingWhenCellsLoseFocus
              />
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <Dialog
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        title="Find and Replace"
        footer={
          <>
            <Button size="sm" onClick={() => setIsFindReplaceOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={applyFindReplace}>
              Replace
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-mono">
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)]">Rows</label>
            <div className="space-y-2 rounded-[0.375em] border border-[var(--content-border)] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="find-replace-rows"
                  checked={findReplaceRows === "selected"}
                  onChange={() => setFindReplaceRows("selected")}
                />
                <span>{selectedRowCount} selected rows</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="find-replace-rows"
                  checked={findReplaceRows === "all"}
                  onChange={() => setFindReplaceRows("all")}
                />
                <span>All Rows</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-secondary)]">Columns</label>
              <button
                type="button"
                onClick={() =>
                  setFindReplaceColumns((current) =>
                    current.length === document.columns.length ? [] : [...document.columns],
                  )
                }
                className="cursor-pointer text-xs text-[var(--primary-color)] hover:underline"
              >
                {findReplaceColumns.length === document.columns.length
                  ? "Clear All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {document.columns.map((column) => (
                <InputCheckbox
                  key={column}
                  label={<span className="font-mono">{column}</span>}
                  checked={findReplaceColumns.includes(column)}
                  onChange={(event) =>
                    setFindReplaceColumns((current) =>
                      event.target.checked
                        ? [...current, column]
                        : current.filter((item) => item !== column),
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Find</label>
            <Input
              autoFocus
              value={findText}
              onChange={(event) => setFindText(event.target.value)}
              placeholder="Find text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <InputCheckbox
              label="Match Whole string"
              checked={matchWholeString}
              onChange={(event) => setMatchWholeString(event.target.checked)}
            />
            <InputCheckbox
              label="Case Sensitive"
              checked={caseSensitive}
              onChange={(event) => setCaseSensitive(event.target.checked)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">Replace</label>
            <Input
              value={replaceText}
              onChange={(event) => setReplaceText(event.target.value)}
              placeholder="Replace text"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isCopyRangeOpen}
        onClose={() => setIsCopyRangeOpen(false)}
        title="Copy Range"
        footer={
          <>
            <Button size="sm" onClick={() => setIsCopyRangeOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                void copySelectedRangeToClipboard();
              }}
            >
              Copy
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-mono">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">
              Format
            </label>
            <Select
              autoFocus
              value={copyRangeFormat}
              onChange={(event) =>
                setCopyRangeFormat(event.target.value as CsvDelimiter)
              }
            >
              <option value=",">CSV</option>
              <option value="\t">Excel (TSV)</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)]">Rows</label>
            <div className="space-y-2 rounded-[0.375em] border border-[var(--content-border)] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="copy-range-rows"
                  checked={copyRangeRows === "selected"}
                  onChange={() => setCopyRangeRows("selected")}
                />
                <span>{selectedRowCount} Selected Rows</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="copy-range-rows"
                  checked={copyRangeRows === "all"}
                  onChange={() => setCopyRangeRows("all")}
                />
                <span>All Rows</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-secondary)]">
                Columns
              </label>
              <button
                type="button"
                onClick={() =>
                  setCopyRangeColumns((current) =>
                    current.length === document.columns.length
                      ? []
                      : [...document.columns],
                  )
                }
                className="cursor-pointer text-xs text-[var(--primary-color)] hover:underline"
              >
                {copyRangeColumns.length === document.columns.length
                  ? "Clear All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {document.columns.map((column) => (
                <InputCheckbox
                  key={column}
                  label={<span>{column}</span>}
                  checked={copyRangeColumns.includes(column)}
                  onChange={(event) =>
                    setCopyRangeColumns((current) =>
                      event.target.checked
                        ? [...current, column]
                        : current.filter((item) => item !== column),
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        title="New CSV"
        footer={
          <>
            <Button size="sm" onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={createNewDocument}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-mono">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">
              Columns
            </label>
            <textarea
              autoFocus
              value={newColumnsInput}
              onChange={(event) => setNewColumnsInput(event.target.value)}
              placeholder="Name, Email, Status"
              rows={4}
              className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-2 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary-color)] focus:outline-none"
            />
            <p className="text-xs text-[var(--text-secondary)]">
              Enter comma-separated column names. Leave blank to start with an
              empty CSV.
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isAddColumnsOpen}
        onClose={() => setIsAddColumnsOpen(false)}
        title="Add Columns"
        footer={
          <>
            <Button size="sm" onClick={() => setIsAddColumnsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={addColumns}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-mono">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">
              Column Names
            </label>
            <textarea
              autoFocus
              value={columnsInput}
              onChange={(event) => setColumnsInput(event.target.value)}
              placeholder="Name, Email, Status"
              rows={4}
              className="w-full rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-2 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary-color)] focus:outline-none"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)]">
                Position
              </label>
              <Select
                value={columnInsertPosition}
                onChange={(event) =>
                  setColumnInsertPosition(
                    event.target.value as ColumnInsertPosition,
                  )
                }
              >
                <option value="start">Start</option>
                <option value="end">End</option>
                <option value="at">At</option>
              </Select>
            </div>

            {columnInsertPosition === "at" ? (
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-secondary)]">
                  At Column
                </label>
                <Select
                  value={columnAtTarget}
                  onChange={(event) => setColumnAtTarget(event.target.value)}
                >
                  {document.columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isDeleteColumnsOpen}
        onClose={() => setIsDeleteColumnsOpen(false)}
        title="Delete Columns"
        footer={
          <>
            <Button size="sm" onClick={() => setIsDeleteColumnsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={removeColumns}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-2 font-mono">
          {document.columns.map((column) => (
            <InputCheckbox
              key={column}
              autoFocus={column === document.columns[0]}
              label={<span>{column}</span>}
              checked={columnsToDelete.includes(column)}
              onChange={(event) =>
                setColumnsToDelete((current) =>
                  event.target.checked
                    ? [...current, column]
                    : current.filter((item) => item !== column),
                )
              }
            />
          ))}
        </div>
      </Dialog>

      <Dialog
        isOpen={isFillSelectionOpen}
        onClose={() => setIsFillSelectionOpen(false)}
        title="Fill"
        footer={
          <>
            <Button size="sm" onClick={() => setIsFillSelectionOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => applyFillSelection("")}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => applyFillSelection(fillValue)}
            >
              Fill
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-mono">
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-secondary)]">Rows</label>
            <div className="space-y-2 rounded-[0.375em] border border-[var(--content-border)] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="fill-target-rows"
                  autoFocus
                  checked={fillTargetRows === "selected"}
                  onChange={() => setFillTargetRows("selected")}
                />
                <span>{selectedRowCount} Selected Rows (default)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="fill-target-rows"
                  checked={fillTargetRows === "all"}
                  onChange={() => setFillTargetRows("all")}
                />
                <span>All Rows</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-secondary)]">
                Columns
              </label>
              <button
                type="button"
                onClick={() =>
                  setFillTargetColumns((current) =>
                    current.length === document.columns.length
                      ? []
                      : [...document.columns],
                  )
                }
                className="cursor-pointer text-xs text-[var(--primary-color)] hover:underline"
              >
                {fillTargetColumns.length === document.columns.length
                  ? "Clear All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {document.columns.map((column) => (
                <InputCheckbox
                  key={column}
                  label={<span>{column}</span>}
                  checked={fillTargetColumns.includes(column)}
                  onChange={(event) =>
                    setFillTargetColumns((current) =>
                      event.target.checked
                        ? [...current, column]
                        : current.filter((item) => item !== column),
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">
              Fill Value
            </label>
            <Input
              value={fillValue}
              onChange={(event) => setFillValue(event.target.value)}
              placeholder="Value to apply"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isAddRowsOpen}
        onClose={() => setIsAddRowsOpen(false)}
        title="Add Rows"
        footer={
          <>
            <Button size="sm" onClick={() => setIsAddRowsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={addRows}>
              Insert
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-end gap-0 font-mono">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">
              Number of Rows
            </label>
            <Input
              autoFocus
              type="number"
              min={1}
              value={rowsToInsert}
              onChange={(event) =>
                setRowsToInsert(Math.max(1, Number(event.target.value) || 1))
              }
              className="rounded-r-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)]">
              Position
            </label>
            <Select
              value={rowInsertPosition}
              onChange={(event) =>
                setRowInsertPosition(event.target.value as RowInsertPosition)
              }
              className="rounded-none font-mono"
            >
              <option value="start">Start</option>
              <option value="end">End</option>
              <option value="row">Row Num</option>
            </Select>
          </div>

          {rowInsertPosition === "row" ? (
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)]">
                Row Num
              </label>
              <Input
                type="number"
                min={1}
                value={rowInsertNumber}
                onChange={(event) =>
                  setRowInsertNumber(
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
                className="rounded-l-none font-mono"
              />
            </div>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}

function getColumnInsertIndex(
  columns: string[],
  position: ColumnInsertPosition,
  atColumn: string,
): number {
  if (position === "start") {
    return 0;
  }

  if (position === "at") {
    const index = columns.indexOf(atColumn);
    return index >= 0 ? index : columns.length;
  }

  return columns.length;
}

function getRowInsertIndex(
  rowCount: number,
  position: RowInsertPosition,
  rowNumber: number,
): number {
  if (position === "start") {
    return 0;
  }

  if (position === "row") {
    return Math.min(Math.max(rowNumber - 1, 0), rowCount);
  }

  return rowCount;
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
}

function MenuItem({ children, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
    >
      {children}
    </button>
  );
}

interface CsvHeaderMenuParams extends CustomHeaderProps<CsvEditorRow> {
  onCopyColumnValues?: (columnId: string, uniqueOnly: boolean) => Promise<void>;
}

function CsvHeaderMenu(props: CsvHeaderMenuParams) {
  const columnId = props.column?.getColId();
  const isFilterActive = props.column?.isFilterActive() ?? false;

  if (!columnId || columnId === "__rowNumber") {
    return <span>{props.displayName}</span>;
  }

  return (
    <div className="group flex h-full items-center justify-between gap-2 overflow-hidden">
      <button
        type="button"
        className="min-w-0 truncate text-left"
        onClick={() => props.progressSort?.(false)}
        title={props.displayName}
      >
        {props.displayName}
      </button>
      <div
        className={`flex items-center gap-1 transition-opacity ${
          isFilterActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {props.enableFilterButton || isFilterActive ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              props.showFilter(event.currentTarget);
            }}
            className={`flex h-6 w-6 items-center justify-center rounded border text-xs ${
              isFilterActive
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-[var(--input-border)] text-[var(--text-secondary)]"
            }`}
            aria-label={`Filter ${props.displayName}`}
            title={`Filter ${props.displayName}`}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2 3h12l-5 5v4l-2 1V8L2 3Z" />
            </svg>
          </button>
        ) : null}

        <MenuButton label="⋮">
          <HeaderMenuItem
            onClick={() => {
              void props.onCopyColumnValues?.(columnId, false);
            }}
          >
            Copy Values
          </HeaderMenuItem>
          <HeaderMenuItem
            onClick={() => {
              void props.onCopyColumnValues?.(columnId, true);
            }}
          >
            Copy Unique Values
          </HeaderMenuItem>
        </MenuButton>
      </div>
    </div>
  );
}

interface HeaderMenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
}

function HeaderMenuItem({ children, onClick }: HeaderMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
    >
      {children}
    </button>
  );
}

function getColumnValues(
  api: GridApi<CsvEditorRow> | null,
  rows: CsvEditorRow[],
  columnId: string,
  uniqueOnly: boolean,
): string[] {
  const values: string[] = [];

  if (api) {
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) {
        values.push(node.data[columnId] ?? "");
      }
    });
  } else {
    rows.forEach((row) => {
      values.push(row[columnId] ?? "");
    });
  }

  if (!uniqueOnly) {
    return values;
  }

  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function splitFilterParts(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function matchesAnyPart(value: string, filterValue: string): boolean {
  const parts = splitFilterParts(filterValue);
  if (parts.length === 0) {
    return true;
  }

  const normalizedValue = value.toLowerCase();
  return parts.some((part) => normalizedValue.includes(part));
}

function matchesAnyRowPart(
  row: CsvEditorRow | undefined,
  columns: string[],
  parts: string[],
): boolean {
  if (!row || parts.length === 0) {
    return true;
  }

  const haystack = columns
    .map((column) => row[column] ?? "")
    .join(" ")
    .toLowerCase();
  return parts.some((part) => haystack.includes(part));
}
