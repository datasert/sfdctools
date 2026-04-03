"use client";

import { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  METADATA_REGISTRY_SOURCE_URL,
  normalizeMetadataRegistry,
  type MetadataRegistryFile,
  type MetadataRegistryRow,
} from "@/lib/metadata-registry";

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

const columnDefs: ColDef<MetadataRegistryRow>[] = [
  {
    field: "type",
    headerName: "Type",
    flex: 1.2,
    minWidth: 220,
    filter: "agTextColumnFilter",
  },
  {
    field: "directory",
    headerName: "Directory",
    flex: 1,
    minWidth: 180,
    filter: "agTextColumnFilter",
  },
  {
    field: "fileExtn",
    headerName: "File Extn",
    flex: 0.8,
    minWidth: 140,
    filter: "agTextColumnFilter",
  },
  {
    field: "inFolder",
    headerName: "In Folder",
    flex: 0.7,
    minWidth: 120,
    filter: "agTextColumnFilter",
    valueFormatter: (params) => (params.value ? "Yes" : "No"),
  },
  {
    field: "strictDirectory",
    headerName: "Strict Directory",
    flex: 0.9,
    minWidth: 150,
    filter: "agTextColumnFilter",
    valueFormatter: (params) => (params.value ? "Yes" : "No"),
  },
];

function escapeCsvValue(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function MetadataRegistryBrowser() {
  const [rows, setRows] = useState<MetadataRegistryRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const loadRegistry = async (signal?: AbortSignal) => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(METADATA_REGISTRY_SOURCE_URL, {
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load registry (${response.status} ${response.statusText}).`,
        );
      }

      const payload = (await response.json()) as MetadataRegistryFile;
      if (!payload || typeof payload !== "object") {
        throw new Error("Unexpected metadata registry response.");
      }

      const rows = normalizeMetadataRegistry(payload);
      setRows(rows);
      setStatus("ready");
      setLastLoadedAt(new Date().toLocaleString());
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load metadata registry.",
      );
    }
  };

  const exportAllRecordsAsCsv = () => {
    if (rows.length === 0) {
      return;
    }

    const csvRows = [
      ["Type", "Directory", "File Extn", "In Folder", "Strict Directory"],
      ...rows.map((row) => [
        escapeCsvValue(row.type),
        escapeCsvValue(row.directory),
        escapeCsvValue(row.fileExtn),
        row.inFolder ? "Yes" : "No",
        row.strictDirectory ? "Yes" : "No",
      ]),
    ];

    const blob = new Blob([csvRows.map((row) => row.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "metadata-types.csv";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  useEffect(() => {
    setIsMounted(true);
    const controller = new AbortController();
    void loadRegistry(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div className="h-full overflow-hidden">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
        <section className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)]">
          <div className="h-[3px] bg-[var(--primary-color)]" />
          <div className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                    Metadata Types
                  </h1>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                    Browse the Salesforce metadata types in a grid.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium">
                    {status === "loading"
                      ? "Loading..."
                      : `${rows.length} types loaded`}
                  </span>
                  <a
                    href={METADATA_REGISTRY_SOURCE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-3 py-1 font-medium text-[var(--primary-color)] underline-offset-4 hover:underline"
                  >
                    Source URL
                  </a>
                  <Button
                    size="sm"
                    onClick={exportAllRecordsAsCsv}
                    disabled={rows.length === 0}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:w-[28rem]">
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search type, directory, extension, or flags"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {status === "error" ? (
                    <span className="text-xs text-[var(--danger-color)]">
                      {errorMessage ?? "Unable to load registry."}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--content-border)] bg-[var(--content-color)]">
          {!isMounted || (status === "loading" && rows.length === 0) ? (
            <div className="flex h-full min-h-[16rem] items-center justify-center px-6 text-center">
              <div className="max-w-md space-y-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Loading registry
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Fetching metadataRegistry.json through the proxy and preparing
                  the grid.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[24rem] overflow-hidden">
              <AgGridReact<MetadataRegistryRow>
                theme={gridTheme}
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={{
                  sortable: true,
                  resizable: true,
                  filter: true,
                }}
                quickFilterText={searchText}
                getRowId={(params) => params.data.type}
                animateRows={false}
                suppressColumnMoveAnimation
                rowSelection={{ mode: "singleRow" }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
