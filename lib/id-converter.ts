/**
 * Salesforce ID Converter Utilities
 * Converts between 15-character and 18-character Salesforce IDs
 */

const SUFFIX_LOOKUP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

/**
 * Validates if a string is a valid Salesforce ID format
 */
export function isValidSalesforceId(id: string): boolean {
  // Salesforce IDs are alphanumeric and typically 15 or 18 characters
  return /^[a-zA-Z0-9]{15,18}$/.test(id);
}

/**
 * Converts a 15-character Salesforce ID to 18-character format
 * @param id15 - 15-character Salesforce ID
 * @returns 18-character Salesforce ID
 */
export function to18(id15: string): string {
  if (id15.length !== 15) {
    throw new Error("Input ID must be exactly 15 characters");
  }
  
  if (!isValidSalesforceId(id15)) {
    throw new Error("Invalid Salesforce ID format");
  }

  let suffix = "";
  
  // Process 3 chunks of 5 characters each
  for (let block = 0; block < 3; block++) {
    const chunk = id15.substring(block * 5, block * 5 + 5);
    let flags = 0;
    
    // For each character in the chunk, check if it's uppercase
    for (let pos = 0; pos < 5; pos++) {
      const c = chunk.charAt(pos);
      if (c >= "A" && c <= "Z") {
        flags |= (1 << pos);
      }
    }
    
    // Map the flags value to a character from the lookup table
    suffix += SUFFIX_LOOKUP.charAt(flags);
  }
  
  return id15 + suffix;
}

/**
 * Converts an 18-character Salesforce ID to 15-character format
 * @param id18 - 18-character Salesforce ID
 * @returns 15-character Salesforce ID
 */
export function to15(id18: string): string {
  if (id18.length !== 18) {
    throw new Error("Input ID must be exactly 18 characters");
  }
  
  if (!isValidSalesforceId(id18)) {
    throw new Error("Invalid Salesforce ID format");
  }
  
  // Simply return the first 15 characters
  return id18.substring(0, 15);
}

/**
 * Converts a single ID (auto-detects direction)
 * @param id - Salesforce ID (15 or 18 characters)
 * @returns Converted ID
 */
export function convertId(id: string): string {
  const trimmed = id.trim();
  
  if (trimmed.length === 15) {
    return to18(trimmed);
  } else if (trimmed.length === 18) {
    return to15(trimmed);
  } else {
    throw new Error("ID must be 15 or 18 characters");
  }
}

/**
 * Converts multiple IDs line by line
 * @param input - Multiline string of IDs
 * @param direction - 'to18' or 'to15' or 'auto'
 * @returns Object with converted lines and errors
 */
export function convertIds(
  input: string,
  direction: 'to18' | 'to15' | 'auto' = 'auto'
): { converted: string; errors: Array<{ line: number; id: string; error: string }> } {
  const lines = input.split('\n');
  const convertedLines: string[] = [];
  const errors: Array<{ line: number; id: string; error: string }> = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Preserve empty lines
    if (!trimmed) {
      convertedLines.push('');
      return;
    }
    
    // Check if it looks like a Salesforce ID (15 or 18 alphanumeric characters)
    const isPotentialId = /^[a-zA-Z0-9]{15,18}$/.test(trimmed);
    
    if (!isPotentialId) {
      // Not a valid Salesforce ID format, output as-is
      convertedLines.push(line); // Use original line to preserve whitespace
      return;
    }
    
    try {
      let result: string;
      
      if (direction === 'to18') {
        if (trimmed.length === 15) {
          result = to18(trimmed);
        } else if (trimmed.length === 18) {
          // Already 18, return as is or convert to 15 then back to 18
          result = to18(to15(trimmed));
        } else {
          // Invalid length but looks like ID, output as-is
          convertedLines.push(line);
          return;
        }
      } else if (direction === 'to15') {
        if (trimmed.length === 18) {
          result = to15(trimmed);
        } else if (trimmed.length === 15) {
          // Already 15, return as is
          result = trimmed;
        } else {
          // Invalid length but looks like ID, output as-is
          convertedLines.push(line);
          return;
        }
      } else {
        // Auto mode
        if (trimmed.length === 15 || trimmed.length === 18) {
          result = convertId(trimmed);
        } else {
          // Invalid length, output as-is
          convertedLines.push(line);
          return;
        }
      }
      
      convertedLines.push(result);
    } catch (error) {
      // If conversion fails, output the original line as-is
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        line: index + 1,
        id: trimmed,
        error: errorMessage,
      });
      convertedLines.push(line); // Output original line instead of error message
    }
  });
  
  return {
    converted: convertedLines.join('\n'),
    errors,
  };
}
