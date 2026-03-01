export interface JsonCleanupOptions {
  removeNullUndefined: boolean;
  removeFalse: boolean;
  removeBlank: boolean;
  removeNullUndefinedArrayItems: boolean;
  removeBlankArrayItems: boolean;
  removeEmptyArray: boolean;
  removeEmptyObject: boolean;
  sortJsonFields: boolean;
}

export const defaultJsonCleanupOptions: JsonCleanupOptions = {
  removeNullUndefined: false,
  removeFalse: false,
  removeBlank: false,
  removeNullUndefinedArrayItems: false,
  removeBlankArrayItems: false,
  removeEmptyArray: false,
  removeEmptyObject: false,
  sortJsonFields: false,
};

function isBlankString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length === 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function shouldRemoveObjectField(value: unknown, options: JsonCleanupOptions): boolean {
  if (options.removeNullUndefined && (value === null || value === undefined)) {
    return true;
  }

  if (options.removeFalse && value === false) {
    return true;
  }

  if (options.removeBlank && isBlankString(value)) {
    return true;
  }

  return false;
}

function shouldRemoveArrayItem(value: unknown, options: JsonCleanupOptions): boolean {
  if (options.removeNullUndefinedArrayItems && (value === null || value === undefined)) {
    return true;
  }

  if (options.removeBlankArrayItems && isBlankString(value)) {
    return true;
  }

  return false;
}

export function cleanupJsonValue(value: unknown, options: JsonCleanupOptions): unknown {
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map((item) => cleanupJsonValue(item, options))
      .filter((item) => !shouldRemoveArrayItem(item, options))
      .filter((item) => !(options.removeEmptyArray && Array.isArray(item) && item.length === 0))
      .filter((item) => !(options.removeEmptyObject && isPlainObject(item) && Object.keys(item).length === 0));

    return cleanedArray;
  }

  if (isPlainObject(value)) {
    const keys = options.sortJsonFields
      ? Object.keys(value).sort((a, b) => a.localeCompare(b))
      : Object.keys(value);

    const cleanedObject: Record<string, unknown> = {};

    for (const key of keys) {
      const cleanedValue = cleanupJsonValue(value[key], options);
      if (shouldRemoveObjectField(cleanedValue, options)) {
        continue;
      }
      if (options.removeEmptyArray && Array.isArray(cleanedValue) && cleanedValue.length === 0) {
        continue;
      }
      if (options.removeEmptyObject && isPlainObject(cleanedValue) && Object.keys(cleanedValue).length === 0) {
        continue;
      }
      cleanedObject[key] = cleanedValue;
    }

    return cleanedObject;
  }

  return value;
}
