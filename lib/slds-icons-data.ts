import fs from "fs";
import path from "path";
import type { IconInfo } from "./icon-utils";

interface RawIconGroup {
  name: string;
  icons: Array<{
    sprite: string;
    symbol: string;
  }>;
}

interface RawIconMetadata {
  synonyms?: string[];
}

interface IconsDataResult {
  icons: IconInfo[];
  categories: string[];
}

const RAW_DIR = path.join(process.cwd(), "public", "slds-icons", "raw");
const LEGACY_DATA_FILE = path.join(process.cwd(), "public", "icons-data.json");

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch (error) {
    console.error(`Failed to read JSON from ${filePath}:`, error);
    return null;
  }
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildIconName(category: string, symbol: string): string {
  return `${category}:${symbol}`;
}

export function buildSldsIconsData(): IconsDataResult {
  const groups = readJsonFile<RawIconGroup[]>(path.join(RAW_DIR, "ui.icons.json"));
  if (!groups || groups.length === 0) {
    return { icons: [], categories: [] };
  }

  const icons: IconInfo[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    const category = group.name;
    const metadataBySymbol =
      readJsonFile<Record<string, RawIconMetadata>>(
        path.join(RAW_DIR, `${category}-icons-metadata.json`)
      ) || {};

    for (const rawIcon of group.icons || []) {
      const symbolId = rawIcon.symbol;
      const sprite = rawIcon.sprite || category;
      const key = buildIconName(category, symbolId);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      const aliases = dedupeStrings(metadataBySymbol[symbolId]?.synonyms || []);

      icons.push({
        category,
        name: symbolId,
        iconName: key,
        sprite,
        symbolId,
        spritePath: `/slds-icons/sprites/${sprite}-symbols.svg`,
        aliases,
      });
    }
  }

  icons.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  const categories = Array.from(new Set(icons.map((icon) => icon.category))).sort();
  return { icons, categories };
}

export function loadSldsIconsData(): IconsDataResult {
  const runtimeData = buildSldsIconsData();
  if (runtimeData.icons.length > 0) {
    return runtimeData;
  }

  const legacyData = readJsonFile<IconsDataResult>(LEGACY_DATA_FILE);
  if (!legacyData) {
    return { icons: [], categories: [] };
  }

  return {
    icons: legacyData.icons || [],
    categories: legacyData.categories || [],
  };
}
