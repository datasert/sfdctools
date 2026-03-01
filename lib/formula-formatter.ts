// @ts-ignore - formulon uses CommonJS exports
import { ast, parse } from 'formulon';

/**
 * Format a Salesforce formula using the AST
 * @param formula - The formula string to format
 * @param options - Formatting options
 * @returns Formatted formula or error message
 */
export function formatFormula(
  formula: string,
  options: { lineWidth?: number; uppercase?: boolean } = {}
): { formatted: string; error: string | null } {
  const { lineWidth = 150, uppercase = true } = options;

  if (!formula.trim()) {
    return { formatted: '', error: null };
  }

  try {
    // First validate by parsing
    const parseResult = parse(formula);
    
    if (parseResult.type === 'error') {
      return {
        formatted: formula, // Return original on error
        error: parseResult.message || `Error: ${parseResult.errorType}`,
      };
    }

    // Get AST and format it
    const formulaAst = ast(formula);
    const formatted = formatAst(formulaAst, { lineWidth, uppercase, indent: 0 });
    
    return { formatted, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      formatted: formula, // Return original on error
      error: errorMessage,
    };
  }
}

/**
 * Format AST node to string
 */
function formatAst(
  node: any,
  options: { lineWidth: number; uppercase: boolean; indent: number }
): string {
  const { lineWidth, uppercase, indent } = options;
  const indentStr = ' '.repeat(indent * 2);

  if (!node) {
    return '';
  }

  switch (node.type) {
    case 'callExpression': {
      const funcName = uppercase ? node.id.toUpperCase() : node.id.toLowerCase();
      const args = node.arguments || [];
      
      if (args.length === 0) {
        return `${funcName}()`;
      }
      
      // Format all arguments
      const formattedArgs = args.map((arg: any) => 
        formatAst(arg, { ...options, indent: indent + 1 })
      );
      
      // Try single line first
      const singleLine = `${funcName}(${formattedArgs.join(', ')})`;
      
      if (singleLine.length <= lineWidth && !singleLine.includes('\n')) {
        return singleLine;
      }
      
      // Multi-line format
      const argsWithCommas = formattedArgs
        .map((arg: string, idx: number) => 
          `${indentStr}  ${arg}${idx < formattedArgs.length - 1 ? ',' : ''}`
        )
        .join('\n');
      
      return `${funcName}(\n${argsWithCommas}\n${indentStr})`;
    }

    case 'binaryExpression': {
      const operator = ` ${node.operator} `;
      const left = formatAst(node.left, options);
      const right = formatAst(node.right, options);
      const expr = `${left}${operator}${right}`;
      
      // If it fits on one line, return it
      if (expr.length <= lineWidth && !expr.includes('\n')) {
        return expr;
      }
      
      // Multi-line format for binary expressions
      const rightIndent = indentStr + ' '.repeat(operator.length);
      return `${left}\n${rightIndent}${right}`;
    }

    case 'identifier':
      return node.name || '';

    case 'literal':
      if (node.dataType === 'text') {
        // Preserve original string value (formulon already handles escaping)
        const value = String(node.value || '');
        // Check if it's already quoted
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          return value;
        }
        // Escape internal quotes and wrap
        const escaped = value.replace(/"/g, '\\"');
        return `"${escaped}"`;
      } else if (node.dataType === 'checkbox') {
        return node.value ? 'TRUE' : 'FALSE';
      } else if (node.dataType === 'null') {
        return 'NULL';
      } else {
        return String(node.value ?? '');
      }

    case 'memberExpression':
      const object = formatAst(node.object, options);
      const property = formatAst(node.property, options);
      return `${object}.${property}`;

    case 'unaryExpression':
      return `${node.operator}${formatAst(node.argument, options)}`;

    case 'conditionalExpression':
      const test = formatAst(node.test, options);
      const consequent = formatAst(node.consequent, options);
      const alternate = formatAst(node.alternate, options);
      const conditional = `${test} ? ${consequent} : ${alternate}`;
      
      if (conditional.length <= lineWidth && !conditional.includes('\n')) {
        return conditional;
      }
      
      return `${test}\n${indentStr}? ${consequent}\n${indentStr}: ${alternate}`;

    case 'arrayExpression':
      const elements = (node.elements || []).map((el: any) => 
        formatAst(el, options)
      );
      return `[${elements.join(', ')}]`;

    case 'parenthesizedExpression':
      const expr = formatAst(node.expression, options);
      return `(${expr})`;

    default:
      // Fallback for unknown node types - try common properties
      if (node.value !== undefined) {
        return String(node.value);
      }
      if (node.name !== undefined) {
        return String(node.name);
      }
      // Last resort: return empty or stringified node
      return '';
  }
}
