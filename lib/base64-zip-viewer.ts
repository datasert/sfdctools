import JSZip from "jszip";

const MAX_HEX_PREVIEW_BYTES = 2048;

export interface Base64ZipFileEntry {
  path: string;
  name: string;
  size: number;
  compressedSize: number;
  method: string;
  language: string;
  content: string;
  isBinary: boolean;
}

export interface Base64ZipArchive {
  files: Base64ZipFileEntry[];
}

function cleanBase64(value: string): string {
  return value
    .replace(/^data:.*?;base64,/, "")
    .replace(/[\s\r\n\t]+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
}

function isLikelyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) {
    return true;
  }

  let suspicious = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      return false;
    }

    if ((byte < 9 && byte !== 0x09) || (byte > 0x0d && byte < 0x20)) {
      suspicious += 1;
    }
  }

  return suspicious / bytes.length < 0.1;
}

function bytesToHexPreview(bytes: Uint8Array): string {
  const preview = bytes.slice(0, MAX_HEX_PREVIEW_BYTES);
  const lines: string[] = ["Binary file preview", ""];

  for (let offset = 0; offset < preview.length; offset += 16) {
    const chunk = preview.slice(offset, offset + 16);
    const hex = Array.from(chunk)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(chunk)
      .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : "."))
      .join("");

    lines.push(
      `${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(47, " ")}  ${ascii}`,
    );
  }

  if (bytes.length > MAX_HEX_PREVIEW_BYTES) {
    lines.push("");
    lines.push(`... truncated ${bytes.length - MAX_HEX_PREVIEW_BYTES} bytes`);
  }

  return lines.join("\n");
}

function inferLanguage(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  switch (extension) {
    case "json":
      return "json";
    case "xml":
      return "xml";
    case "html":
    case "htm":
      return "html";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "css":
      return "css";
    case "js":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "sql":
      return "sql";
    case "csv":
      return "csv";
    case "txt":
    default:
      return "plaintext";
  }
}

async function decodeFileContent(
  bytes: Uint8Array,
  path: string,
): Promise<{ content: string; isBinary: boolean; language: string }> {
  const language = inferLanguage(path);

  if (!isLikelyText(bytes)) {
    return {
      content: bytesToHexPreview(bytes),
      isBinary: true,
      language: "plaintext",
    };
  }

  return {
    content: new TextDecoder("utf-8").decode(bytes),
    isBinary: false,
    language,
  };
}

export async function parseBase64ZipArchive(base64: string): Promise<Base64ZipArchive> {
  const normalized = cleanBase64(base64);
  if (!normalized) {
    return { files: [] };
  }

  const zip = await JSZip.loadAsync(normalized, {
    base64: true,
    createFolders: true,
  });

  const files = await Promise.all(
    Object.values(zip.files)
      .filter((file) => !file.dir)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (file) => {
        const bytes = await file.async("uint8array");
        const decoded = await decodeFileContent(bytes, file.name);
        const metadata = file as typeof file & {
          _data?: {
            compressedSize?: number;
            compression?: { magic?: string; name?: string };
          };
        };

        return {
          path: file.name,
          name: file.name.split("/").pop() ?? file.name,
          size: bytes.length,
          compressedSize: metadata._data?.compressedSize ?? bytes.length,
          method: metadata._data?.compression?.name ?? "unknown",
          language: decoded.language,
          content: decoded.content,
          isBinary: decoded.isBinary,
        };
      }),
  );

  return { files };
}
