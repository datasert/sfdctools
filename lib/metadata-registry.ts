export const METADATA_REGISTRY_SOURCE_URL =
  "https://corsproxy.io/?url=https://raw.githubusercontent.com/forcedotcom/source-deploy-retrieve/refs/heads/main/src/registry/metadataRegistry.json";

export interface MetadataRegistryTypeEntry {
  id: string;
  name: string;
  directoryName: string;
  inFolder?: boolean;
  strictDirectoryName?: boolean;
  suffix?: string;
}

export interface MetadataRegistryFile {
  types?: Record<string, MetadataRegistryTypeEntry>;
}

export interface MetadataRegistryRow {
  type: string;
  directory: string;
  fileExtn: string;
  inFolder: boolean;
  strictDirectory: boolean;
}

export function normalizeMetadataRegistry(
  payload: MetadataRegistryFile,
): MetadataRegistryRow[] {
  const rows = Object.values(payload.types ?? {})
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      type: entry.name,
      directory: entry.directoryName,
      fileExtn: entry.suffix ?? "",
      inFolder: Boolean(entry.inFolder),
      strictDirectory: Boolean(entry.strictDirectoryName),
    }));

  return rows;
}

