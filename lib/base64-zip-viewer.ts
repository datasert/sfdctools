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

const SAMPLE_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0xc9, 0xfe, 0x92, 0xef, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

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
    case "sh":
      return "shell";
    case "txt":
    default:
      return "plaintext";
  }
}

function isJsonContent(content: string): boolean {
  const trimmed = content.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function isHtmlContent(content: string): boolean {
  const trimmed = content.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    (trimmed.startsWith("<body") || trimmed.startsWith("<head")) ||
    /<html[\s>]|<body[\s>]|<div[\s>]|<section[\s>]/.test(trimmed)
  );
}

function isXmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!(trimmed.startsWith("<?xml") || trimmed.startsWith("<"))) {
    return false;
  }

  return /^<([A-Za-z_][\w:.-]*)(\s|>)/.test(trimmed) || trimmed.startsWith("<?xml");
}

function isYamlContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.startsWith("---") ||
    /^[A-Za-z0-9_-]+:\s+.+/m.test(trimmed) ||
    /^[A-Za-z0-9_-]+:\s*$/m.test(trimmed)
  );
}

function isMarkdownContent(content: string): boolean {
  return (
    /^#{1,6}\s+/m.test(content) ||
    /^-\s+/m.test(content) ||
    /^\*\s+/m.test(content) ||
    /```/.test(content)
  );
}

function isSqlContent(content: string): boolean {
  return /^\s*(select|with|insert|update|delete|merge|create|alter)\b/i.test(content);
}

function isCssContent(content: string): boolean {
  return /[.#]?[A-Za-z][\w-]*\s*\{[\s\S]*:[\s\S]*\}/.test(content);
}

function isShellContent(content: string): boolean {
  return /^\s*#!\/bin\/(ba|z)?sh/.test(content) || /^\s*(export|echo|if\s|\w+=)/m.test(content);
}

function isCsvContent(content: string): boolean {
  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return false;
  }

  const firstCommaCount = (lines[0].match(/,/g) ?? []).length;
  return firstCommaCount > 0 && lines.slice(1, 4).every((line) => (line.match(/,/g) ?? []).length === firstCommaCount);
}

function isTypeScriptContent(content: string): boolean {
  return (
    /\binterface\s+\w+/.test(content) ||
    /\btype\s+\w+\s*=/.test(content) ||
    /\bimport\s+type\b/.test(content) ||
    /:\s*[A-Z][A-Za-z0-9_<>\[\]\|&?, ]+/.test(content)
  );
}

function isJavaScriptContent(content: string): boolean {
  return (
    /\b(import|export|const|let|function)\b/.test(content) ||
    /=>/.test(content)
  );
}

function inferLanguageFromContent(content: string): string {
  if (isJsonContent(content)) return "json";
  if (isHtmlContent(content)) return "html";
  if (isXmlContent(content)) return "xml";
  if (isYamlContent(content)) return "yaml";
  if (isMarkdownContent(content)) return "markdown";
  if (isSqlContent(content)) return "sql";
  if (isCssContent(content)) return "css";
  if (isCsvContent(content)) return "csv";
  if (isShellContent(content)) return "shell";
  if (isTypeScriptContent(content)) return "typescript";
  if (isJavaScriptContent(content)) return "javascript";
  return "plaintext";
}

async function decodeFileContent(
  bytes: Uint8Array,
  path: string,
): Promise<{ content: string; isBinary: boolean; language: string }> {
  const languageFromPath = inferLanguage(path);

  if (!isLikelyText(bytes)) {
    return {
      content: bytesToHexPreview(bytes),
      isBinary: true,
      language: "plaintext",
    };
  }

  const content = new TextDecoder("utf-8").decode(bytes);
  const language =
    languageFromPath === "plaintext"
      ? inferLanguageFromContent(content)
      : languageFromPath;

  return {
    content,
    isBinary: false,
    language,
  };
}

export async function createSampleBase64ZipArchive(): Promise<string> {
  const zip = new JSZip();

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        name: "Base64 Zip Viewer Sample",
        generatedAt: "2026-04-07T12:00:00Z",
        entries: 8,
      },
      null,
      2,
    ),
  );
  zip.file(
    "docs/README.md",
    `# Sample Archive

This sample archive exercises the Base64 Zip Viewer with multiple content types.

- JSON
- XML
- HTML
- CSS
- SQL
- YAML without a file extension
- Binary image preview
`,
  );
  zip.file(
    "config/app",
    `environment: sandbox
features:
  search: true
  preview: true
  heuristics: true
`,
  );
  zip.file(
    "pages/email-template",
    `<!doctype html>
<html>
  <body>
    <section>
      <h1>Sample Email</h1>
      <p>Generated from the Base64 Zip Viewer sample archive.</p>
    </section>
  </body>
</html>`,
  );
  zip.file(
    "metadata/workflow.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Workflow>
  <label>Sample Workflow</label>
  <active>true</active>
</Workflow>`,
  );
  zip.file(
    "styles/theme.css",
    `:root {
  --accent: #196ebd;
}

.card {
  border: 1px solid var(--accent);
  padding: 1rem;
}`,
  );
  zip.file(
    "queries/recent_accounts",
    `select Id, Name, Industry
from Account
where LastModifiedDate = LAST_N_DAYS:30
order by Name`,
  );
  zip.file(
    "scripts/transform.ts",
    `export interface AccountRecord {
  id: string;
  name: string;
}

export const normalizeName = (value: string): string => value.trim().toUpperCase();
`,
  );
  zip.file("images/pixel.png", SAMPLE_PNG_BYTES);

  return zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
  });
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
