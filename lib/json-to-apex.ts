export interface JsonToApexOptions {
  rootClassName: string;
  indentSize: number;
  auraEnabled: boolean;
}

export interface JsonType {
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'object' | 'array' | 'null';
  isArray?: boolean;
  itemType?: JsonType;
  properties?: Record<string, JsonType>;
  className?: string;
}

/**
 * Infer Apex type from JSON value
 */
function inferType(value: any): JsonType {
  if (value === null || value === undefined) {
    return { type: 'null' };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      // Empty array - default to List<String>
      return { type: 'array', isArray: true, itemType: { type: 'string' } };
    }
    // Check first non-null item
    const firstItem = value.find(item => item !== null && item !== undefined);
    if (firstItem === undefined) {
      return { type: 'array', isArray: true, itemType: { type: 'string' } };
    }
    const itemType = inferType(firstItem);
    return { type: 'array', isArray: true, itemType };
  }

  if (typeof value === 'object') {
    return { type: 'object' };
  }

  if (typeof value === 'string') {
    // Try to detect Date/DateTime
    const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}$/);
    const dateTimeMatch = value.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
    if (dateTimeMatch) {
      return { type: 'datetime' };
    }
    if (dateMatch) {
      return { type: 'date' };
    }
    return { type: 'string' };
  }

  if (typeof value === 'number') {
    // Check if it's an integer
    if (Number.isInteger(value)) {
      return { type: 'integer' };
    }
    return { type: 'decimal' };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  return { type: 'string' };
}

/**
 * Merge types - when we have multiple values, find the most specific common type
 */
function mergeTypes(type1: JsonType, type2: JsonType): JsonType {
  // If one is null, return the other
  if (type1.type === 'null') return type2;
  if (type2.type === 'null') return type1;

  // If both are arrays, merge item types
  if (type1.type === 'array' && type2.type === 'array') {
    if (type1.itemType && type2.itemType) {
      return {
        type: 'array',
        isArray: true,
        itemType: mergeTypes(type1.itemType, type2.itemType),
      };
    }
    return type1.itemType ? type1 : type2;
  }

  // If types match, return one
  if (type1.type === type2.type) {
    return type1;
  }

  // If one is object and other is not, prefer object
  if (type1.type === 'object') return type1;
  if (type2.type === 'object') return type2;

  // If one is array and other is not, prefer array
  if (type1.type === 'array') return type1;
  if (type2.type === 'array') return type2;

  // For primitives, prefer the more specific type
  // String is least specific, so prefer others
  if (type1.type === 'string') return type2;
  if (type2.type === 'string') return type1;

  // Default to string
  return { type: 'string' };
}

/**
 * Analyze JSON structure and build type map
 */
function analyzeJsonStructure(
  json: any,
  classMap: Map<string, Record<string, JsonType>>,
  classNamePrefix: string = 'Inner'
): string {
  if (json === null || json === undefined) {
    return '';
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return '';
    }
    // Analyze first item
    const firstItem = json.find(item => item !== null && item !== undefined);
    if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
      return analyzeJsonStructure(firstItem, classMap, classNamePrefix);
    }
    return '';
  }

  if (typeof json !== 'object') {
    return '';
  }

  // Generate class name
  const className = classNamePrefix;
  if (classMap.has(className)) {
    return className;
  }

  const properties: Record<string, JsonType> = {};

  // Analyze all properties
  for (const [key, value] of Object.entries(json)) {
    if (value === null || value === undefined) {
      properties[key] = { type: 'string' }; // Default to String for null
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        properties[key] = { type: 'array', isArray: true, itemType: { type: 'string' } };
        continue;
      }

      // Check all items in array
      let mergedType: JsonType = { type: 'null' };
      let hasObject = false;
      let objectClassName = '';

      for (const item of value) {
        if (item === null || item === undefined) continue;
        const itemType = inferType(item);
        mergedType = mergeTypes(mergedType, itemType);

        if (itemType.type === 'object' && typeof item === 'object' && !Array.isArray(item)) {
          hasObject = true;
          // Generate nested class name (no prefix, just the property name + Item)
          const nestedClassName = `${toApexClassName(key)}Item`;
          objectClassName = analyzeJsonStructure(item, classMap, nestedClassName);
        }
      }

      if (hasObject && objectClassName) {
        properties[key] = {
          type: 'array',
          isArray: true,
          itemType: { type: 'object', className: objectClassName },
        };
      } else {
        properties[key] = {
          type: 'array',
          isArray: true,
          itemType: mergedType.type === 'null' ? { type: 'string' } : mergedType,
        };
      }
    } else if (typeof value === 'object') {
      // Nested object - create inner class (no prefix, just the property name)
      const nestedClassName = toApexClassName(key);
      const nestedClass = analyzeJsonStructure(value, classMap, nestedClassName);
      properties[key] = {
        type: 'object',
        className: nestedClass || nestedClassName,
      };
    } else {
      properties[key] = inferType(value);
    }
  }

  classMap.set(className, properties);
  return className;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert property name to valid Apex identifier (Upper Camel Case for classes)
 */
function toApexClassName(name: string): string {
  // Remove special characters, keep alphanumeric and underscore
  let identifier = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Convert to Upper Camel Case (PascalCase)
  // Split by underscore, capitalize first letter of each part, preserve rest
  const parts = identifier.split('_').filter(part => part.length > 0);
  if (parts.length === 0) {
    return 'Field';
  }
  
  // Capitalize first letter of each part, preserve the rest of the casing
  const camelParts = parts.map(part => {
    if (part.length === 0) return '';
    // Capitalize first letter, preserve the rest as-is
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  
  identifier = camelParts.join('');
  
  // Ensure it starts with a letter
  if (identifier.length === 0 || /^[0-9]/.test(identifier)) {
    identifier = 'Field' + identifier;
  }
  
  return identifier;
}

/**
 * Convert property name to valid Apex identifier (lowerCamelCase for variables)
 */
function toApexIdentifier(name: string): string {
  // Remove special characters, keep alphanumeric and underscore
  let identifier = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // If already in camelCase (no underscores), preserve it but ensure first letter is lowercase
  if (!identifier.includes('_')) {
    // Ensure first letter is lowercase, preserve the rest
    if (identifier.length === 0) {
      return 'field';
    }
    const firstChar = identifier.charAt(0).toLowerCase();
    const rest = identifier.slice(1);
    identifier = firstChar + rest;
    
    // Ensure it starts with a letter
    if (identifier.length === 0 || /^[0-9]/.test(identifier)) {
      identifier = 'field' + identifier;
    }
    return identifier;
  }
  
  // Convert from snake_case to lowerCamelCase
  // Split by underscore, lowercase first part, capitalize rest
  const parts = identifier.split('_').filter(part => part.length > 0);
  if (parts.length === 0) {
    return 'field';
  }
  
  // First part is lowercase, rest are capitalized
  const camelParts = parts.map((part, index) => {
    if (part.length === 0) return '';
    if (index === 0) {
      return part.charAt(0).toLowerCase() + part.slice(1);
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  
  identifier = camelParts.join('');
  
  // Ensure it starts with a letter
  if (identifier.length === 0 || /^[0-9]/.test(identifier)) {
    identifier = 'field' + identifier;
  }
  
  return identifier;
}

/**
 * Convert JSON type to Apex type string
 */
function toApexType(type: JsonType, className?: string): string {
  if (type.isArray && type.itemType) {
    const itemType = type.itemType.type === 'object' && type.itemType.className
      ? type.itemType.className
      : toApexType(type.itemType);
    return `List<${itemType}>`;
  }

  switch (type.type) {
    case 'string':
      return 'String';
    case 'integer':
      return 'Integer';
    case 'decimal':
      return 'Decimal';
    case 'boolean':
      return 'Boolean';
    case 'date':
      return 'Date';
    case 'datetime':
      return 'DateTime';
    case 'object':
      return className || type.className || 'Object';
    case 'null':
      return 'String'; // Default to String for null
    default:
      return 'String';
  }
}

/**
 * Generate Apex class code
 */
function generateApexClass(
  rootClassName: string,
  classMap: Map<string, Record<string, JsonType>>,
  indentSize: number,
  auraEnabled: boolean
): string {
  const indent = ' '.repeat(indentSize);
  const lines: string[] = [];
  const annotation = auraEnabled ? '@AuraEnabled\n' : '';

  // Root class
  lines.push(`public class ${rootClassName} {`);
  lines.push('');

  // Root class properties first
  const rootProperties = classMap.get(rootClassName) || classMap.get('Root') || {};
  if (Object.keys(rootProperties).length > 0) {
    for (const [propName, propType] of Object.entries(rootProperties)) {
      const apexPropName = toApexIdentifier(propName);
      const apexType = toApexType(propType, propType.className);
      const defaultValue = propType.type === 'boolean' ? ' = false' : '';
      if (auraEnabled) {
        lines.push(`${indent}@AuraEnabled`);
      }
      lines.push(`${indent}public ${apexType} ${apexPropName}${defaultValue};`);
    }
    lines.push('');
  }

  // Generate inner classes at the bottom (in order they appear in JSON)
  const classNames = Array.from(classMap.keys())
    .filter(name => name !== rootClassName && name !== 'Root');
  
  for (const className of classNames) {
    const properties = classMap.get(className);
    if (!properties) continue;

    lines.push(`${indent}public class ${className} {`);
    
    // Generate properties
    for (const [propName, propType] of Object.entries(properties)) {
      const apexPropName = toApexIdentifier(propName);
      const apexType = toApexType(propType, propType.className);
      const defaultValue = propType.type === 'boolean' ? ' = false' : '';
      if (auraEnabled) {
        lines.push(`${indent}${indent}@AuraEnabled`);
      }
      lines.push(`${indent}${indent}public ${apexType} ${apexPropName}${defaultValue};`);
    }

    lines.push(`${indent}}`);
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Convert JSON to Apex class
 */
export function jsonToApex(
  jsonString: string,
  options: JsonToApexOptions
): { apexCode: string; error: string | null } {
  if (!jsonString.trim()) {
    return { apexCode: '', error: null };
  }

  try {
    const json = JSON.parse(jsonString);
    const classMap = new Map<string, Record<string, JsonType>>();

    // Analyze JSON structure
    const rootClassName = options.rootClassName || 'Root';
    analyzeJsonStructure(json, classMap, rootClassName);

    // If root class has no properties, add them
    if (!classMap.has(rootClassName)) {
      if (typeof json === 'object' && !Array.isArray(json)) {
        const properties: Record<string, JsonType> = {};
        for (const [key, value] of Object.entries(json)) {
          if (value === null || value === undefined) {
            properties[key] = { type: 'string' };
            continue;
          }
          if (Array.isArray(value)) {
            if (value.length === 0) {
              properties[key] = { type: 'array', isArray: true, itemType: { type: 'string' } };
            } else {
              const firstItem = value.find(item => item !== null && item !== undefined);
              if (firstItem && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
                const nestedClassName = `${toApexClassName(key)}Item`;
                analyzeJsonStructure(firstItem, classMap, nestedClassName);
                properties[key] = {
                  type: 'array',
                  isArray: true,
                  itemType: { type: 'object', className: nestedClassName },
                };
              } else {
                const itemType: JsonType = firstItem ? inferType(firstItem) : { type: 'string' };
                properties[key] = { type: 'array', isArray: true, itemType };
              }
            }
          } else if (typeof value === 'object') {
            const nestedClassName = toApexClassName(key);
            analyzeJsonStructure(value, classMap, nestedClassName);
            properties[key] = { type: 'object', className: nestedClassName };
          } else {
            properties[key] = inferType(value);
          }
        }
        classMap.set(rootClassName, properties);
      }
    }

    // Generate Apex code
    const apexCode = generateApexClass(rootClassName, classMap, options.indentSize, options.auraEnabled || false);

    return { apexCode, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { apexCode: '', error: errorMessage };
  }
}
