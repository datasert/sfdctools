import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import {
  deleteIndexedDbValue,
  getIndexedDbValue,
  setIndexedDbValue,
} from "@/lib/indexed-db";

export const SHARE_HASH_PARAM = "config";
const LEGACY_SHARE_HASH_PARAM = "sfdcShare";
const SHARE_LZ_PREFIX = "lz.";
const SHARE_GZIP_PREFIX = "g.";
const SHARE_RAW_PREFIX = "u.";
export const TOOL_STORAGE_PREFIX = "sfdc-tools:";

const TOOL_INDEXED_DB_STORAGE_KEYS: Record<string, string[]> = {
  "formula-formatter": ["input"],
  "html-formatter": ["input"],
  "json-diff": ["left", "right"],
  "json-formatter": ["input"],
  "json-to-apex": ["input"],
  "omni-config-diff": ["left", "right"],
  "soql-formatter": ["input"],
  "text-diff": ["original", "modified"],
  "text-tool": ["input"],
  "xml-formatter": ["input"],
};

export interface ToolSharePayload {
  v: 1;
  toolId: string;
  path: string;
  state: Record<string, string>;
}

function base64UrlToUint8Array(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function gunzipBytes(bytes: Uint8Array): Promise<string> {
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const safeBytes = new Uint8Array(bytes.byteLength);
  safeBytes.set(bytes);
  await writer.write(safeBytes);
  await writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new TextDecoder().decode(buffer);
}

export function getToolStorageKeys(toolId: string): string[] {
  if (typeof window === "undefined") return [];

  const prefix = `${TOOL_STORAGE_PREFIX}${toolId}`;
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      keys.push(key);
    }
  }
  return keys;
}

export function clearAllToolState(): number {
  if (typeof window === "undefined") return 0;

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (key.startsWith(TOOL_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }

  return keysToRemove.length;
}

export async function snapshotToolState(toolId: string): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};

  const state: Record<string, string> = {};
  for (const key of getToolStorageKeys(toolId)) {
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      state[key] = value;
    }
  }

  const indexedDbSuffixes = TOOL_INDEXED_DB_STORAGE_KEYS[toolId] ?? [];
  for (const suffix of indexedDbSuffixes) {
    const indexedDbKey = `${TOOL_STORAGE_PREFIX}${toolId}:${suffix}`;
    const value = await getIndexedDbValue(indexedDbKey);
    if (value !== null) {
      state[indexedDbKey] = value;
    }
  }

  return state;
}

export async function applyToolState(toolId: string, state: Record<string, string>): Promise<void> {
  if (typeof window === "undefined") return;

  for (const key of getToolStorageKeys(toolId)) {
    window.localStorage.removeItem(key);
  }

  const indexedDbSuffixes = TOOL_INDEXED_DB_STORAGE_KEYS[toolId] ?? [];
  for (const suffix of indexedDbSuffixes) {
    await deleteIndexedDbValue(`${TOOL_STORAGE_PREFIX}${toolId}:${suffix}`);
  }

  for (const [key, value] of Object.entries(state)) {
    if (indexedDbSuffixes.some((suffix) => key === `${TOOL_STORAGE_PREFIX}${toolId}:${suffix}`)) {
      if (value === "") {
        await deleteIndexedDbValue(key);
      } else {
        await setIndexedDbValue(key, value);
      }
      continue;
    }

    window.localStorage.setItem(key, value);
  }
}

export async function encodeToolSharePayload(payload: ToolSharePayload): Promise<string> {
  const jsonText = JSON.stringify(payload);
  const lzCompressed = compressToEncodedURIComponent(jsonText);
  return `${SHARE_LZ_PREFIX}${lzCompressed}`;
}

export async function decodeToolSharePayload(encoded: string): Promise<ToolSharePayload | null> {
  if (!encoded) return null;

  if (encoded.startsWith(SHARE_LZ_PREFIX)) {
    const jsonText = decompressFromEncodedURIComponent(encoded.slice(SHARE_LZ_PREFIX.length));
    if (!jsonText) {
      throw new Error("Invalid compressed share URL.");
    }
    return JSON.parse(jsonText) as ToolSharePayload;
  }

  if (encoded.startsWith(SHARE_GZIP_PREFIX)) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser does not support compressed share links.");
    }
    const compressed = base64UrlToUint8Array(encoded.slice(SHARE_GZIP_PREFIX.length));
    return JSON.parse(await gunzipBytes(compressed)) as ToolSharePayload;
  }

  if (encoded.startsWith(SHARE_RAW_PREFIX)) {
    const rawBytes = base64UrlToUint8Array(encoded.slice(SHARE_RAW_PREFIX.length));
    return JSON.parse(new TextDecoder().decode(rawBytes)) as ToolSharePayload;
  }

  return null;
}

export async function decodeToolSharePayloadFromHash(hash: string): Promise<ToolSharePayload | null> {
  const hashValue = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!hashValue) return null;

  const params = new URLSearchParams(hashValue);
  const encoded = params.get(SHARE_HASH_PARAM) ?? params.get(LEGACY_SHARE_HASH_PARAM);
  if (!encoded) return null;
  return decodeToolSharePayload(encoded);
}
