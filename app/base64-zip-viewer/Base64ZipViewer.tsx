"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { EditorPane } from "@/components/EditorPane";
import { EditorWrapper } from "@/components/EditorWrapper";
import { MonacoEditor } from "@/components/MonacoEditor";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import { Splitter } from "@/components/Splitter";
import { usePersistedTextState } from "@/lib/use-persisted-text-state";
import {
  parseBase64ZipArchive,
  type Base64ZipArchive,
  type Base64ZipFileEntry,
} from "@/lib/base64-zip-viewer";

const STORAGE_KEY = "sfdc-tools:base64-zip-viewer";

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = size / 1024;
  let unit = units[0];
  for (let index = 0; index < units.length; index += 1) {
    unit = units[index];
    if (value < 1024 || index === units.length - 1) {
      break;
    }
    value /= 1024;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

type ZipTreeNode = {
  name: string;
  path: string;
  kind: "folder" | "file";
  size?: number;
  children: ZipTreeNode[];
};

type ZipMatchInfo = {
  pathMatch: boolean;
  contentMatch: boolean;
};

function buildZipTree(files: Base64ZipFileEntry[]): ZipTreeNode[] {
  const root: ZipTreeNode[] = [];
  const folderMap = new Map<string, ZipTreeNode>();

  const ensureFolder = (path: string, name: string): ZipTreeNode => {
    const existing = folderMap.get(path);
    if (existing) {
      return existing;
    }

    const node: ZipTreeNode = {
      name,
      path,
      kind: "folder",
      children: [],
    };
    folderMap.set(path, node);
    return node;
  };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let currentChildren = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      const nextPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      if (isFile) {
        currentChildren.push({
          name: part,
          path: file.path,
          kind: "file",
          size: file.size,
          children: [],
        });
        return;
      }

      const folder = ensureFolder(nextPath, part);
      if (!currentChildren.includes(folder)) {
        currentChildren.push(folder);
      }

      currentChildren = folder.children;
      currentPath = nextPath;
    });
  }

  const sortNodes = (nodes: ZipTreeNode[]) => {
    nodes.sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(root);
  return root;
}

function getMatchInfo(file: Base64ZipFileEntry, query: string): ZipMatchInfo {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return { pathMatch: false, contentMatch: false };
  }

  return {
    pathMatch: file.path.toLowerCase().includes(normalizedQuery),
    contentMatch: file.content.toLowerCase().includes(normalizedQuery),
  };
}

function filterZipTree(
  nodes: ZipTreeNode[],
  matches: Map<string, ZipMatchInfo>,
): ZipTreeNode[] {
  const filtered: ZipTreeNode[] = [];

  for (const node of nodes) {
    if (node.kind === "file") {
      const match = matches.get(node.path);
      if (match?.pathMatch || match?.contentMatch) {
        filtered.push(node);
      }
      continue;
    }

    const children = filterZipTree(node.children, matches);
    if (children.length > 0) {
      filtered.push({ ...node, children });
    }
  }

  return filtered;
}

function collectExpandedPaths(nodes: ZipTreeNode[], target: Set<string>) {
  for (const node of nodes) {
    if (node.kind === "folder") {
      target.add(node.path);
      collectExpandedPaths(node.children, target);
    }
  }
}

function getEditorLanguage(entry?: Base64ZipFileEntry): string {
  return entry?.language ?? "plaintext";
}

function ZipTreeView({
  nodes,
  selectedPath,
  expandedPaths,
  onToggleFolder,
  onSelectFile,
  matches,
  depth = 0,
}: {
  nodes: ZipTreeNode[];
  selectedPath: string;
  expandedPaths: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  matches: Map<string, ZipMatchInfo>;
  depth?: number;
}) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => {
        const isSelected = node.kind === "file" && node.path === selectedPath;
        const isExpanded = node.kind === "folder" && expandedPaths.has(node.path);

        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() =>
                node.kind === "folder" ? onToggleFolder(node.path) : onSelectFile(node.path)
              }
              className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "bg-[var(--primary-color)] text-[var(--primary-text)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
              }`}
              style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--text-tertiary)]">
                {node.kind === "folder" ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <path d={isExpanded ? "M6 14l6-6 6 6" : "M8 6l8 6-8 6"} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current">
                    <path d="M12 4.5l6 6v9h-12v-15h6z" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs leading-5">
                {node.name}
              </span>
              {node.kind === "file" ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  {matches.get(node.path)?.pathMatch ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isSelected
                          ? "bg-white/15 text-[var(--primary-text)]"
                          : "bg-[var(--faded-color)] text-[var(--text-secondary)]"
                      }`}
                    >
                      name
                    </span>
                  ) : null}
                  {matches.get(node.path)?.contentMatch ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isSelected
                          ? "bg-white/15 text-[var(--primary-text)]"
                          : "bg-[var(--faded-color)] text-[var(--text-secondary)]"
                      }`}
                    >
                      content
                    </span>
                  ) : null}
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] ${
                      isSelected
                        ? "bg-white/15 text-[var(--primary-text)]"
                        : "bg-[var(--faded-color)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {formatBytes(node.size ?? 0)}
                  </span>
                </div>
              ) : (
                <span className="shrink-0 text-[11px] text-[var(--text-tertiary)]">
                  {node.children.length}
                </span>
              )}
            </button>

            {node.kind === "folder" && isExpanded ? (
              <ZipTreeView
                nodes={node.children}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
                matches={matches}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function Base64ZipViewer() {
  const [input, setInput] = usePersistedTextState(`${STORAGE_KEY}:input`, "");
  const [searchQuery, setSearchQuery] = useState("");
  const [archive, setArchive] = useState<Base64ZipArchive>({ files: [] });
  const [selectedPath, setSelectedPath] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const parseArchive = async () => {
      if (!input.trim()) {
        setArchive({ files: [] });
        setError(null);
        setIsParsing(false);
        return;
      }

      setIsParsing(true);

      try {
        const nextArchive = await parseBase64ZipArchive(input);
        if (isCancelled) {
          return;
        }

        setArchive(nextArchive);
        setError(null);
      } catch (err) {
        if (isCancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : String(err);
        setArchive({ files: [] });
        setError(message);
      } finally {
        if (!isCancelled) {
          setIsParsing(false);
        }
      }
    };

    void parseArchive();

    return () => {
      isCancelled = true;
    };
  }, [input]);

  useEffect(() => {
    if (!archive.files.length) {
      setSelectedPath("");
      setExpandedPaths([]);
      return;
    }

    setExpandedPaths((current) => {
      const next = new Set(current);
      for (const file of archive.files) {
        const parts = file.path.split("/").filter(Boolean);
        let currentPath = "";
        for (let index = 0; index < parts.length - 1; index += 1) {
          currentPath = currentPath ? `${currentPath}/${parts[index]}` : parts[index];
          next.add(currentPath);
        }
      }
      return Array.from(next);
    });

    if (!archive.files.some((file) => file.path === selectedPath)) {
      setSelectedPath(archive.files[0].path);
    }
  }, [archive.files, selectedPath]);

  const matches = useMemo(() => {
    const map = new Map<string, ZipMatchInfo>();
    for (const file of archive.files) {
      map.set(file.path, getMatchInfo(file, searchQuery));
    }
    return map;
  }, [archive.files, searchQuery]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      return archive.files;
    }

    return archive.files.filter((file) => {
      const match = matches.get(file.path);
      return Boolean(match?.pathMatch || match?.contentMatch);
    });
  }, [archive.files, matches, searchQuery]);

  const clearAll = () => {
    setInput("");
    setSearchQuery("");
    setArchive({ files: [] });
    setSelectedPath("");
    setExpandedPaths([]);
    setError(null);
  };

  const expandedPathSet = useMemo(() => new Set(expandedPaths), [expandedPaths]);
  const treeNodes = useMemo(() => buildZipTree(filteredFiles), [filteredFiles]);

  const visibleTreeNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return treeNodes;
    }

    return filterZipTree(treeNodes, matches);
  }, [matches, searchQuery, treeNodes]);

  const visibleFileCount = filteredFiles.length;
  const displayFiles = searchQuery.trim() ? filteredFiles : archive.files;

  const selectedFile = useMemo(
    () => displayFiles.find((file) => file.path === selectedPath) ?? displayFiles[0] ?? null,
    [displayFiles, selectedPath],
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const nextExpanded = new Set<string>();
    collectExpandedPaths(visibleTreeNodes, nextExpanded);
    setExpandedPaths(Array.from(nextExpanded));
  }, [searchQuery, visibleTreeNodes]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const nextSelected =
      filteredFiles.find((file) => file.path === selectedPath) ?? filteredFiles[0] ?? null;
    if (nextSelected && nextSelected.path !== selectedPath) {
      setSelectedPath(nextSelected.path);
    }
  }, [filteredFiles, searchQuery, selectedPath]);

  const fileCount = archive.files.length;
  const inputLineCount = input ? input.split("\n").length : 0;
  const selectedContentLineCount = selectedFile?.content
    ? selectedFile.content.split("\n").length
    : 0;

  return (
    <div className="flex h-full flex-col">
      <SettingsBar>
        <SettingsGroup>
          <SettingsLabel>Base64 ZIP:</SettingsLabel>
          <span className="text-xs text-[var(--text-secondary)]">
            Paste a Base64-encoded ZIP archive into the top editor.
          </span>
        </SettingsGroup>

        <div className="ml-auto">
          <Button type="button" onClick={clearAll} size="sm">
            Reset
          </Button>
        </div>
      </SettingsBar>

      <Splitter
        orientation="vertical"
        storageKey={`${STORAGE_KEY}:main-split`}
        defaultSize={28}
        minSize={16}
        maxSize={60}
        className="p-3"
      >
        <EditorPane
          label="Base64 ZIP Input"
          count={`${inputLineCount} line${inputLineCount === 1 ? "" : "s"}`}
        >
          <EditorWrapper>
            <MonacoEditor
              value={input}
              onChange={(value) => setInput(value || "")}
              language="plaintext"
            />
          </EditorWrapper>
        </EditorPane>

        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <div className="text-xs text-[var(--text-secondary)]">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : isParsing ? (
                "Parsing archive..."
              ) : (
                `${visibleFileCount} of ${fileCount} file${fileCount === 1 ? "" : "s"} shown`
              )}
            </div>
            {selectedFile ? (
              <div className="text-xs text-[var(--text-tertiary)]">
                {selectedFile.path} {formatBytes(selectedFile.size)}
              </div>
            ) : null}
          </div>

          <Splitter
            orientation="horizontal"
            storageKey={`${STORAGE_KEY}:files-split`}
            defaultSize={32}
            minSize={18}
            maxSize={70}
            className="min-h-0 flex-1"
          >
            <EditorPane
              label="Files"
              count={`${visibleFileCount} file${visibleFileCount === 1 ? "" : "s"}`}
              headerRight={
                <div className="flex items-center gap-2">
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search names or contents"
                  className="w-56"
                />
              </div>
            }
          >
            <EditorWrapper className="min-h-0">
                <div className="h-full overflow-auto bg-[var(--content-color)] p-2">
                  {error ? (
                    <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                      {error}
                    </div>
                  ) : archive.files.length ? (
                    <ZipTreeView
                      nodes={visibleTreeNodes}
                      selectedPath={selectedPath}
                      expandedPaths={expandedPathSet}
                      onToggleFolder={(path) => {
                        setExpandedPaths((current) =>
                          current.includes(path)
                            ? current.filter((entry) => entry !== path)
                            : [...current, path],
                        );
                      }}
                      onSelectFile={setSelectedPath}
                      matches={matches}
                    />
                  ) : (
                    <div className="rounded border border-dashed border-[var(--content-border)] p-4 text-sm text-[var(--text-secondary)]">
                      Paste a Base64 ZIP to inspect its files here.
                    </div>
                  )}
                </div>
              </EditorWrapper>
            </EditorPane>

            <EditorPane
              label={selectedFile ? selectedFile.name : "Contents"}
              count={
                selectedFile
                  ? `${selectedContentLineCount} line${selectedContentLineCount === 1 ? "" : "s"}`
                  : "0 lines"
              }
            >
              <EditorWrapper className="min-h-0">
                {selectedFile ? (
                  <MonacoEditor
                    value={selectedFile.content}
                    language={getEditorLanguage(selectedFile)}
                    readOnly={true}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[var(--content-color)] p-6 text-sm text-[var(--text-secondary)]">
                    No file selected.
                  </div>
                )}
              </EditorWrapper>
            </EditorPane>
          </Splitter>
        </div>
      </Splitter>
    </div>
  );
}
