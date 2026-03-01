import { existsSync, readFileSync } from "fs";
import { join } from "path";

export type SldsCssPreviewType =
  | "Color"
  | "Spacing"
  | "Typography"
  | "Border"
  | "Shadow"
  | "Sizing"
  | "Layout"
  | "Generic";

export interface SldsCssClassDeclaration {
  property: string;
  value: string;
}

export interface SldsCssClassItem {
  utility: string;
  className: string;
  selector: string;
  summary: string;
  group: string;
  declarations: SldsCssClassDeclaration[];
  previewType: SldsCssPreviewType;
}

interface RawSldsCssClassPayload {
  items?: SldsCssClassItem[];
}

const PREVIEW_TYPE_ORDER: SldsCssPreviewType[] = [
  "Color",
  "Spacing",
  "Typography",
  "Border",
  "Shadow",
  "Sizing",
  "Layout",
  "Generic",
];

export function loadSldsCssClasses() {
  const filePath = join(process.cwd(), "public", "slds-css-classes", "classes.json");
  if (!existsSync(filePath)) {
    return {
      classes: [] as SldsCssClassItem[],
      utilities: [] as string[],
      previewTypes: [] as SldsCssPreviewType[],
    };
  }

  let parsed: RawSldsCssClassPayload = {};
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8")) as RawSldsCssClassPayload;
  } catch {
    parsed = {};
  }

  const classes = (parsed.items ?? [])
    .filter((item) => item && item.className && item.utility)
    .map((item) => ({
      ...item,
      declarations: Array.isArray(item.declarations) ? item.declarations : [],
    }))
    .sort((a, b) => {
      if (a.utility !== b.utility) {
        return a.utility.localeCompare(b.utility);
      }
      return a.className.localeCompare(b.className);
    });

  const utilities = Array.from(new Set(classes.map((item) => item.utility))).sort((a, b) =>
    a.localeCompare(b)
  );

  const previewTypes = PREVIEW_TYPE_ORDER.filter((type) =>
    classes.some((item) => item.previewType === type)
  );

  return {
    classes,
    utilities,
    previewTypes,
  };
}
