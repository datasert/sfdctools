import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

export type SldsHookPreviewType =
  | "Color"
  | "Shadow"
  | "Radius"
  | "Border Width"
  | "Spacing"
  | "Sizing"
  | "Ratio"
  | "Font Family"
  | "Font Size"
  | "Font Weight"
  | "Line Height"
  | "Generic";

export interface SldsStylingHook {
  name: string;
  cssVar: string;
  value: string;
  resolvedValue: string;
  sourceFile: string;
  category: string;
  type: string;
  syntax: string;
  scope: string;
  group: string;
  comment: string;
  inherits?: boolean;
  cssProperties: string[];
  previewType: SldsHookPreviewType;
}

interface RawAlias {
  value?: string;
}

interface RawHookProp {
  name?: string;
  value?: string;
  type?: string;
  category?: string;
  syntax?: string;
  inherits?: boolean;
  scope?: string;
  group?: string;
  comment?: string;
  cssProperties?: string[];
}

interface RawHookFile {
  global?: {
    category?: string;
    type?: string;
    syntax?: string;
    scope?: string;
    group?: string;
    cssProperties?: string[];
  };
  aliases?: Record<string, RawAlias>;
  props?: RawHookProp[] | Record<string, RawHookProp>;
}

interface ParsedHookFileEntry {
  filePath: string;
  parsed: RawHookFile;
}

const TYPE_ORDER: SldsHookPreviewType[] = [
  "Color",
  "Shadow",
  "Radius",
  "Border Width",
  "Spacing",
  "Sizing",
  "Ratio",
  "Font Family",
  "Font Size",
  "Font Weight",
  "Line Height",
  "Generic",
];

// Fallback aliases used by styling-hooks imports (font-sizes.json).
// These values are taken from SLDS design token aliases and cover the keys used by props/font.json.
const IMPORTED_ALIAS_FALLBACKS: Record<string, string> = {
  FONT_SIZE_1: "0.625rem",
  FONT_SIZE_2: "0.75rem",
  FONT_SIZE_3: "0.8125rem",
  FONT_SIZE_4: "0.875rem",
  FONT_SIZE_5: "1rem",
  FONT_SIZE_6: "1.125rem",
  FONT_SIZE_7: "1.25rem",
  FONT_SIZE_8: "1.5rem",
  FONT_SIZE_9: "1.75rem",
  FONT_SIZE_10: "2rem",
  FONT_SIZE_11: "2.625rem",
  FONT_SIZE_BASE: "1rem",
  FONT_SIZE_NEG_1: "0.875rem",
  FONT_SIZE_NEG_2: "0.8125rem",
  FONT_SIZE_NEG_3: "0.75rem",
  FONT_SIZE_NEG_4: "0.625rem",
};

const COMPATIBILITY_ALIAS_MAP: Record<string, string[]> = {
  "--slds-g-radius-border-circle": ["--slds-g-radius-border-pill"],
};

interface SemanticColorAliasHook {
  name: string;
  alias: string;
  group?: string;
}

const SEMANTIC_COLOR_ALIAS_HOOKS: SemanticColorAliasHook[] = [
  // Surface colors
  { name: "color-surface-1", alias: "PALETTE_WARM_GRAY_1", group: "surface" },
  { name: "color-surface-2", alias: "PALETTE_WARM_GRAY_2", group: "surface" },
  { name: "color-surface-3", alias: "PALETTE_WARM_GRAY_3", group: "surface" },
  { name: "color-surface-4", alias: "PALETTE_WARM_GRAY_4", group: "surface" },
  { name: "color-on-surface-1", alias: "PALETTE_WARM_GRAY_13", group: "surface" },
  { name: "color-on-surface-2", alias: "PALETTE_WARM_GRAY_10", group: "surface" },
  { name: "color-on-surface-3", alias: "PALETTE_WARM_GRAY_9", group: "surface" },
  { name: "color-on-surface-4", alias: "PALETTE_WARM_GRAY_5", group: "surface" },

  // Accent colors
  { name: "color-accent-1", alias: "PALETTE_CLOUD_BLUE_60", group: "accent" },
  { name: "color-accent-2", alias: "PALETTE_BLUE_50", group: "accent" },
  { name: "color-accent-3", alias: "PALETTE_BLUE_20", group: "accent" },
  { name: "color-accent-4", alias: "PALETTE_BLUE_10", group: "accent" },
  { name: "color-on-accent-1", alias: "PALETTE_WARM_GRAY_1", group: "accent" },
  { name: "color-on-accent-2", alias: "PALETTE_BLUE_95", group: "accent" },
  { name: "color-on-accent-3", alias: "PALETTE_BLUE_80", group: "accent" },
  { name: "color-on-accent-4", alias: "PALETTE_BLUE_20", group: "accent" },

  // Success colors
  { name: "color-success-1", alias: "PALETTE_GREEN_70", group: "success" },
  { name: "color-success-2", alias: "PALETTE_GREEN_50", group: "success" },
  { name: "color-success-3", alias: "PALETTE_GREEN_30", group: "success" },
  { name: "color-success-4", alias: "PALETTE_GREEN_10", group: "success" },
  { name: "color-on-success-1", alias: "PALETTE_WARM_GRAY_1", group: "success" },
  { name: "color-on-success-2", alias: "PALETTE_GREEN_95", group: "success" },
  { name: "color-on-success-3", alias: "PALETTE_GREEN_80", group: "success" },
  { name: "color-on-success-4", alias: "PALETTE_GREEN_30", group: "success" },

  // Warning colors
  { name: "color-warning-1", alias: "PALETTE_ORANGE_70", group: "warning" },
  { name: "color-warning-2", alias: "PALETTE_YELLOW_40", group: "warning" },
  { name: "color-warning-3", alias: "PALETTE_ORANGE_15", group: "warning" },
  { name: "color-warning-4", alias: "PALETTE_YELLOW_10", group: "warning" },
  { name: "color-on-warning-1", alias: "PALETTE_WARM_GRAY_1", group: "warning" },
  { name: "color-on-warning-2", alias: "PALETTE_YELLOW_95", group: "warning" },
  { name: "color-on-warning-3", alias: "PALETTE_YELLOW_80", group: "warning" },
  { name: "color-on-warning-4", alias: "PALETTE_ORANGE_15", group: "warning" },

  // Error colors
  { name: "color-error-1", alias: "PALETTE_RED_50", group: "error" },
  { name: "color-error-2", alias: "PALETTE_RED_30", group: "error" },
  { name: "color-error-3", alias: "PALETTE_RED_10", group: "error" },
  { name: "color-error-4", alias: "PALETTE_RED_10", group: "error" },
  { name: "color-on-error-1", alias: "PALETTE_WARM_GRAY_1", group: "error" },
  { name: "color-on-error-2", alias: "PALETTE_RED_95", group: "error" },
  { name: "color-on-error-3", alias: "PALETTE_RED_80", group: "error" },
  { name: "color-on-error-4", alias: "PALETTE_RED_20", group: "error" },
];

function collectJsonFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function flattenAliases(aliases: Record<string, RawAlias> | undefined): Record<string, string> {
  if (!aliases) {
    return {};
  }

  const flat: Record<string, string> = {};
  for (const [aliasName, alias] of Object.entries(aliases)) {
    if (alias && typeof alias.value === "string") {
      flat[aliasName] = alias.value;
    }
  }
  return flat;
}

function applyAliases(value: string, aliases: Record<string, string>): string {
  let current = value;

  // Resolve nested aliases up to a small max depth to avoid runaway cycles.
  for (let i = 0; i < 6; i += 1) {
    const next = current.replace(/\{\!([A-Z0-9_]+)\}/g, (_, aliasName: string) => {
      const aliasValue = aliases[aliasName];
      return typeof aliasValue === "string" ? aliasValue : `{!${aliasName}}`;
    });

    if (next === current) {
      break;
    }
    current = next;
  }

  return current;
}

function inferPreviewType(hook: {
  name: string;
  category: string;
  type: string;
  syntax: string;
  cssProperties: string[];
}): SldsHookPreviewType {
  const name = hook.name.toLowerCase();
  const category = hook.category.toLowerCase();
  const type = hook.type.toLowerCase();
  const syntax = hook.syntax.toLowerCase();
  const cssProperties = hook.cssProperties.map((property) => property.toLowerCase());
  const hasCssProp = (property: string) => cssProperties.includes(property);

  if (
    type === "color" ||
    syntax.includes("color") ||
    category.includes("color") ||
    category.includes("transparent") ||
    hasCssProp("color") ||
    hasCssProp("background-color") ||
    hasCssProp("border-color") ||
    hasCssProp("fill")
  ) {
    return "Color";
  }

  if (name.includes("shadow") || hasCssProp("box-shadow")) {
    return "Shadow";
  }

  if (name.includes("radius") || hasCssProp("border-radius")) {
    return "Radius";
  }

  if (name.includes("sizing-border") || hasCssProp("border-width")) {
    return "Border Width";
  }

  if (
    category.includes("spacing") ||
    hasCssProp("padding") ||
    hasCssProp("margin") ||
    hasCssProp("top") ||
    hasCssProp("right") ||
    hasCssProp("bottom") ||
    hasCssProp("left")
  ) {
    return "Spacing";
  }

  if (category.includes("ratio") || hasCssProp("aspect-ratio")) {
    return "Ratio";
  }

  if (name.includes("font-family") || hasCssProp("font-family")) {
    return "Font Family";
  }

  if (name.includes("font-weight") || hasCssProp("font-weight")) {
    return "Font Weight";
  }

  if (name.includes("lineheight") || hasCssProp("line-height")) {
    return "Line Height";
  }

  if (
    name.includes("font-size") ||
    name.includes("font-scale") ||
    hasCssProp("font-size")
  ) {
    return "Font Size";
  }

  if (category.includes("sizing") || name.startsWith("sizing-") || hasCssProp("width")) {
    return "Sizing";
  }

  return "Generic";
}

export function loadSldsStylingHooks() {
  const rootDir = join(process.cwd(), "public", "slds-styling-hooks");
  if (!existsSync(rootDir)) {
    return {
      hooks: [] as SldsStylingHook[],
      availableTypes: [] as SldsHookPreviewType[],
      sourceFiles: [] as string[],
    };
  }

  const jsonFiles = collectJsonFiles(rootDir);
  const hooks: SldsStylingHook[] = [];
  const parsedFiles: ParsedHookFileEntry[] = [];

  for (const filePath of jsonFiles) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as RawHookFile;
      if (parsed && typeof parsed === "object") {
        parsedFiles.push({ filePath, parsed });
      }
    } catch {
      // Ignore unreadable JSON files
    }
  }

  const globalAliases: Record<string, string> = {
    ...IMPORTED_ALIAS_FALLBACKS,
  };
  for (const { parsed } of parsedFiles) {
    Object.assign(globalAliases, flattenAliases(parsed.aliases));
  }

  for (const { filePath, parsed } of parsedFiles) {
    if (!parsed || typeof parsed !== "object" || !parsed.props) {
      continue;
    }

    const aliases = {
      ...globalAliases,
      ...flattenAliases(parsed.aliases),
    };
    const globalCategory = parsed.global?.category ?? "uncategorized";
    const globalType = parsed.global?.type ?? "raw";
    const globalSyntax = parsed.global?.syntax ?? "";
    const globalScope = parsed.global?.scope ?? "global";
    const globalGroup = parsed.global?.group ?? "";
    const globalCssProperties = parsed.global?.cssProperties ?? [];

    const sourceFile = relative(rootDir, filePath);
    const props = Array.isArray(parsed.props)
      ? parsed.props
      : Object.entries(parsed.props).map(([propName, prop]) => ({
          ...prop,
          name: prop.name ?? propName,
        }));

    for (const prop of props) {
      if (!prop || typeof prop !== "object") {
        continue;
      }

      const name = prop.name?.trim();
      if (!name) {
        continue;
      }

      const value = typeof prop.value === "string" ? prop.value : "";
      const resolvedValue = applyAliases(value, aliases);
      const category = prop.category ?? globalCategory;
      const type = prop.type ?? globalType;
      const syntax = prop.syntax ?? globalSyntax;
      const scope = prop.scope ?? globalScope;
      const group = prop.group ?? globalGroup;
      const cssProperties = prop.cssProperties ?? globalCssProperties;
      const previewType = inferPreviewType({
        name,
        category,
        type,
        syntax,
        cssProperties,
      });

      hooks.push({
        name,
        cssVar: `--slds-g-${name}`,
        value,
        resolvedValue,
        sourceFile,
        category,
        type,
        syntax,
        scope,
        group,
        comment: prop.comment ?? "",
        inherits: prop.inherits,
        cssProperties,
        previewType,
      });
    }
  }

  const compatibilityHooks: SldsStylingHook[] = [];
  for (const hook of hooks) {
    const aliases = COMPATIBILITY_ALIAS_MAP[hook.cssVar];
    if (!aliases?.length) {
      continue;
    }

    for (const aliasCssVar of aliases) {
      compatibilityHooks.push({
        ...hook,
        name: aliasCssVar.replace(/^--slds-g-/, ""),
        cssVar: aliasCssVar,
      });
    }
  }

  const existingCssVars = new Set(hooks.map((hook) => hook.cssVar));
  for (const hook of compatibilityHooks) {
    existingCssVars.add(hook.cssVar);
  }

  const semanticCompatibilityHooks: SldsStylingHook[] = [];
  for (const semanticHook of SEMANTIC_COLOR_ALIAS_HOOKS) {
    const cssVar = `--slds-g-${semanticHook.name}`;
    if (existingCssVars.has(cssVar)) {
      continue;
    }

    const aliasValue = `{!${semanticHook.alias}}`;
    const resolvedValue = applyAliases(aliasValue, globalAliases);
    if (resolvedValue.includes("{!")) {
      continue;
    }

    semanticCompatibilityHooks.push({
      name: semanticHook.name,
      cssVar,
      value: aliasValue,
      resolvedValue,
      sourceFile: "compat/semantic-colors",
      category: "color",
      type: "color",
      syntax: "<color>",
      scope: "global",
      group: semanticHook.group ?? "theme",
      comment: "Compatibility semantic color hook generated from SLDS alias tokens.",
      inherits: true,
      cssProperties: ["background-color", "color", "border-color", "fill"],
      previewType: "Color",
    });
  }

  const dedupedHooks = Array.from(
    new Map(
      [...hooks, ...compatibilityHooks, ...semanticCompatibilityHooks].map((hook) => [
        hook.cssVar,
        hook,
      ])
    ).values()
  ).sort((a, b) => {
    if (a.previewType !== b.previewType) {
      return TYPE_ORDER.indexOf(a.previewType) - TYPE_ORDER.indexOf(b.previewType);
    }
    return a.name.localeCompare(b.name);
  });

  const availableTypes = TYPE_ORDER.filter((type) =>
    dedupedHooks.some((hook) => hook.previewType === type)
  );

  return {
    hooks: dedupedHooks,
    availableTypes,
    sourceFiles: jsonFiles.map((filePath) => relative(rootDir, filePath)),
  };
}
