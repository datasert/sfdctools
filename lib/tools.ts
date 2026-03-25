export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  tags: string[];
  icon?: string;
}

export const tools: Tool[] = [
  {
    id: "slds-icons",
    name: "SLDS Icons",
    description:
      "Browse and search all available Salesforce Lightning Design System icons with copy and download options.",
    path: "/slds-icons",
    tags: ["Icons", "SLDS", "Salesforce"],
  },
  {
    id: "slds-styling-hooks",
    name: "SLDS Styling Hooks",
    description:
      "Search and explore SLDS styling hooks with type-based previews for color, spacing, typography, radius, shadows, and more.",
    path: "/slds-styling-hooks",
    tags: ["SLDS", "Styling Hooks", "Salesforce", "Design Tokens"],
  },
  {
    id: "slds-css-classes",
    name: "SLDS CSS Classes",
    description:
      "Search and explore SLDS utility CSS classes with property-based previews and copy-ready usage snippets.",
    path: "/slds-css-classes",
    tags: ["SLDS", "CSS Classes", "Utilities", "Salesforce"],
  },
  {
    id: "slds-colors",
    name: "SLDS Colors",
    description:
      "Browse SLDS color hooks as swatches. Click a swatch to copy the hook name or use more actions to copy HEX, RGB, and HSL values.",
    path: "/slds-colors",
    tags: ["SLDS", "Colors", "Salesforce", "Design Tokens"],
  },
  {
    id: "id-converter",
    name: "Convert IDs",
    description:
      "Convert Salesforce IDs between 15-character and 18-character formats. Supports batch conversion line by line.",
    path: "/convert-ids",
    tags: ["ID", "Converter", "Salesforce"],
  },
  {
    id: "extract-ids",
    name: "Extract IDs",
    description:
      "Extract Salesforce IDs from pasted text and optionally group them by object using the first three characters of each ID.",
    path: "/extract-ids",
    tags: ["ID", "Extractor", "Salesforce", "Utility"],
  },
  {
    id: "soql-formatter",
    name: "SOQL Formatter",
    description:
      "Format and beautify SOQL queries with customizable line width and keyword casing. Formats as you type.",
    path: "/soql-formatter",
    tags: ["SOQL", "Formatter", "Salesforce"],
  },
  // {
  //   id: "formula-formatter",
  //   name: "Formula Formatter",
  //   description:
  //     "Format and beautify Salesforce formulas with customizable line width and keyword casing. Formats as you type.",
  //   path: "/formula-formatter",
  //   tags: ["Formula", "Formatter", "Salesforce"],
  // },
  {
    id: "in-clause-generator",
    name: "IN Clause Generator",
    description:
      "Generate Salesforce SOQL IN clause strings from a list of values. Supports deduplication, sorting, and custom formatting.",
    path: "/in-clause-generator",
    tags: ["SOQL", "IN Clause", "Generator", "Salesforce"],
  },
  {
    id: "csv-editor",
    name: "CSV Editor",
    description:
      "Load CSV or TSV from a file or clipboard, edit cells in a grid, and bulk add or remove rows and columns.",
    path: "/csv-editor",
    tags: ["CSV", "TSV", "Grid", "Data", "Editor"],
  },
  {
    id: "text-tool",
    name: "Text Tool",
    description:
      "Apply series of text transformations (trim, dedupe, sort, shuffle, etc.) in customizable order. Process text line by line.",
    path: "/text-tool",
    tags: ["Text", "Processor", "Transform"],
  },
  {
    id: "text-diff",
    name: "Text Diff",
    description:
      "Compare two texts side-by-side and view differences. Shows a visual diff with additions, deletions, and modifications highlighted.",
    path: "/text-diff",
    tags: ["Diff", "Compare", "Text", "Utility"],
  },
  {
    id: "json-to-apex",
    name: "JSON to Apex",
    description:
      "Convert JSON structure to Apex class with inner classes. Automatically generates Apex code representing the JSON shape.",
    path: "/json-to-apex",
    tags: ["JSON", "Apex", "Salesforce", "Code Generation"],
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description:
      "Format and beautify JSON with customizable indentation. Validates JSON and formats as you type.",
    path: "/json-formatter",
    tags: ["JSON", "Formatter", "Beautify"],
  },
  {
    id: "json-diff",
    name: "JSON Diff",
    description:
      "Compare two JSON documents side-by-side with optional cleanup rules (remove null/blank/empty values and sort fields) before diffing.",
    path: "/json-diff",
    tags: ["JSON", "Diff", "Compare", "Cleanup", "Utility"],
  },
  {
    id: "xml-formatter",
    name: "XML Formatter",
    description:
      "Format and beautify XML with customizable indentation. Validates XML and formats as you type.",
    path: "/xml-formatter",
    tags: ["XML", "Formatter", "Beautify"],
  },
  {
    id: "xml-diff",
    name: "XML Diff",
    description:
      "Compare two XML documents side-by-side with optional cleanup rules such as trimming text, removing comments, and sorting attributes or tags.",
    path: "/xml-diff",
    tags: ["XML", "Diff", "Compare", "Cleanup", "Utility"],
  },
  {
    id: "omni-config-diff",
    name: "Omni Config XML Diff",
    description:
      "Compare OmniScript XML versions by decoding embedded JSON, sorting JSON keys, and diffing normalized XML side-by-side.",
    path: "/omni-config-diff",
    tags: ["OmniScript", "XML", "JSON", "Diff", "Salesforce"],
  },
  {
    id: "html-formatter",
    name: "HTML Formatter",
    description:
      "Format and beautify HTML with customizable indentation. Validates HTML and formats as you type. Optional preview mode to see rendered HTML.",
    path: "/html-formatter",
    tags: ["HTML", "Formatter", "Beautify", "Preview"],
  },
  {
    id: "datetime-converter",
    name: "DateTime Converter",
    description:
      "Convert and format dates and times across multiple formats. View current time in various formats or create custom datetime cards with timezone support.",
    path: "/datetime-converter",
    tags: ["DateTime", "Converter", "Timezone", "Unix"],
  },
  {
    id: "base64-encoder",
    name: "Base64 Encoder/Decoder",
    description:
      "Encode text to Base64 or decode Base64 to text. Supports real-time conversion with swap functionality.",
    path: "/base64-encoder",
    tags: ["Base64", "Encoder", "Decoder", "Utility"],
  },
  {
    id: "url-encoder",
    name: "URL Encoder/Decoder",
    description:
      "Encode text to URL-encoded format or decode URL-encoded strings. Shows parsed URL details including protocol, host, path, and query parameters.",
    path: "/url-encoder",
    tags: ["URL", "Encoder", "Decoder", "Utility"],
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description:
      "Decode JSON Web Tokens (JWT) and view header, payload, and signature. Optionally verify the signature with a secret key.",
    path: "/jwt-decoder",
    tags: ["JWT", "Token", "Decoder", "Security", "Utility"],
  },
  {
    id: "device-information",
    name: "Device Information",
    description:
      "View comprehensive information about your browser, device, screen, and network. Includes external IP address detection.",
    path: "/device-information",
    tags: ["Device", "Browser", "System", "Network", "Utility"],
  },
];
