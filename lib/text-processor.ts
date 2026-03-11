/**
 * Text Tool - Apply series of transformations to text
 */

export type TransformationType =
  | 'trim'
  | 'pad'
  | 'truncate'
  | 'extract'
  | 'fill'
  | 'split'
  | 'join'
  | 'addPrefixSuffix'
  | 'removePrefixSuffix'
  | 'replace'
  | 'caseConvert'
  | 'filterLines'
  | 'frequencyReport'
  | 'dedupe'
  | 'sort'
  | 'shuffle'
  | 'removeBlankLines';

export type CaseConvertMode = 'lower' | 'upper' | 'title' | 'sentense';
export type FilterLinesMode = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'blank';
export type ReplaceMode = 'text' | 'regex';
export type FrequencyReportMode = 'both' | 'duplicates' | 'nonDuplicates';
export type FillMode = 'text' | 'number';
export type ExtractMode = 'numbers' | 'between' | 'afterString' | 'beforeString' | 'regex';
export type SortMode = 'lexical' | 'length' | 'words';

type BasicTransformationType =
  | 'dedupe'
  | 'shuffle'
  | 'removeBlankLines';

export type Transformation =
  | { id: string; type: BasicTransformationType }
  | { id: string; type: 'trim'; trimStart: boolean; trimEnd: boolean }
  | { id: string; type: 'pad'; padStart: boolean; padEnd: boolean; length: number; padString: string }
  | { id: string; type: 'truncate'; start: boolean; end: boolean; length: number; abbreviate: boolean }
  | {
      id: string;
      type: 'fill';
      mode: FillMode;
      fillAt: number;
      text: string;
      startNumber: number;
      step: number;
      padLength: number;
      padChar: string;
    }
  | {
      id: string;
      type: 'extract';
      mode: ExtractMode;
      string: string;
      start: string;
      end: string;
      last: boolean;
      remove: boolean;
    }
  | { id: string; type: 'sort'; reverse: boolean; mode: SortMode }
  | { id: string; type: 'addPrefixSuffix'; prefix: string; suffix: string; ifMissing: boolean }
  | { id: string; type: 'removePrefixSuffix'; prefix: string; suffix: string }
  | {
      id: string;
      type: 'replace';
      mode: ReplaceMode;
      find: string;
      replaceWith: string;
      all: boolean;
      caseInsensitive: boolean;
    }
  | { id: string; type: 'caseConvert'; mode: CaseConvertMode }
  | { id: string; type: 'filterLines'; mode: FilterLinesMode; value: string; not: boolean }
  | {
      id: string;
      type: 'frequencyReport';
      mode: FrequencyReportMode;
      showCount: boolean;
    }
  | { id: string; type: 'split'; splitChars: string }
  | { id: string; type: 'join'; joinString: string; everyNLines: number };

export function createTransformation(type: TransformationType, id: string): Transformation {
  if (type === 'trim') {
    return { id, type, trimStart: true, trimEnd: true };
  }
  if (type === 'pad') {
    return { id, type, padStart: true, padEnd: true, length: 10, padString: ' ' };
  }
  if (type === 'truncate') {
    return { id, type, start: false, end: true, length: 10, abbreviate: false };
  }
  if (type === 'extract') {
    return {
      id,
      type,
      mode: 'numbers',
      string: '',
      start: '',
      end: '',
      last: false,
      remove: false,
    };
  }
  if (type === 'fill') {
    return {
      id,
      type,
      mode: 'text',
      fillAt: 0,
      text: '',
      startNumber: 0,
      step: 1,
      padLength: 0,
      padChar: '0',
    };
  }
  if (type === 'addPrefixSuffix') {
    return { id, type, prefix: '', suffix: '', ifMissing: true };
  }
  if (type === 'removePrefixSuffix') {
    return { id, type, prefix: '', suffix: '' };
  }
  if (type === 'replace') {
    return { id, type, mode: 'text', find: '', replaceWith: '', all: true, caseInsensitive: true };
  }
  if (type === 'frequencyReport') {
    return { id, type, mode: 'both', showCount: true };
  }
  if (type === 'filterLines') {
    return { id, type, mode: 'contains', value: '', not: false };
  }
  if (type === 'caseConvert') {
    return { id, type, mode: 'lower' };
  }
  if (type === 'sort') {
    return { id, type, reverse: false, mode: 'lexical' };
  }
  if (type === 'split') {
    return { id, type, splitChars: ',' };
  }
  if (type === 'join') {
    return { id, type, joinString: ',', everyNLines: 0 };
  }
  return { id, type };
}

export function normalizeTransformation(value: Transformation): Transformation {
  if (value.type === 'trim') {
    return {
      ...value,
      trimStart: typeof value.trimStart === 'boolean' ? value.trimStart : true,
      trimEnd: typeof value.trimEnd === 'boolean' ? value.trimEnd : true,
    };
  }
  if (value.type === 'pad') {
    const length =
      typeof value.length === 'number' && Number.isFinite(value.length) && value.length >= 0
        ? Math.floor(value.length)
        : 10;
    const padString = typeof value.padString === 'string' ? value.padString : ' ';
    return {
      ...value,
      padStart: typeof value.padStart === 'boolean' ? value.padStart : true,
      padEnd: typeof value.padEnd === 'boolean' ? value.padEnd : true,
      length,
      padString,
    };
  }
  if (value.type === 'truncate') {
    const length =
      typeof value.length === 'number' && Number.isFinite(value.length) && value.length >= 0
        ? Math.floor(value.length)
        : 10;
    return {
      ...value,
      start: Boolean(value.start),
      end: Boolean(value.end),
      length,
      abbreviate: Boolean(value.abbreviate),
    };
  }
  if (value.type === 'extract') {
    const mode: ExtractMode =
      value.mode === 'between' ||
      value.mode === 'afterString' ||
      value.mode === 'beforeString' ||
      value.mode === 'regex'
        ? value.mode
        : 'numbers';
    return {
      ...value,
      mode,
      string: typeof value.string === 'string' ? value.string : '',
      start: typeof value.start === 'string' ? value.start : '',
      end: typeof value.end === 'string' ? value.end : '',
      last: Boolean(value.last),
      remove: Boolean(value.remove),
    };
  }
  if (value.type === 'fill') {
    const toInteger = (input: unknown, fallback: number) =>
      typeof input === 'number' && Number.isFinite(input) ? Math.floor(input) : fallback;
    return {
      ...value,
      mode: value.mode === 'number' ? 'number' : 'text',
      fillAt: Math.max(0, toInteger(value.fillAt, 0)),
      text: typeof value.text === 'string' ? value.text : '',
      startNumber: toInteger(value.startNumber, 0),
      step: toInteger(value.step, 1),
      padLength: Math.max(0, toInteger(value.padLength, 0)),
      padChar: typeof value.padChar === 'string' && value.padChar.length > 0 ? value.padChar : '0',
    };
  }
  if (value.type === 'addPrefixSuffix') {
    return {
      ...value,
      prefix: typeof value.prefix === 'string' ? value.prefix : '',
      suffix: typeof value.suffix === 'string' ? value.suffix : '',
      ifMissing: typeof value.ifMissing === 'boolean' ? value.ifMissing : true,
    };
  }
  if (value.type === 'removePrefixSuffix') {
    return {
      ...value,
      prefix: typeof value.prefix === 'string' ? value.prefix : '',
      suffix: typeof value.suffix === 'string' ? value.suffix : '',
    };
  }
  if (value.type === 'replace') {
    const mode: ReplaceMode = value.mode === 'regex' ? 'regex' : 'text';
    return {
      ...value,
      mode,
      find: typeof value.find === 'string' ? value.find : '',
      replaceWith: typeof value.replaceWith === 'string' ? value.replaceWith : '',
      all: Boolean(value.all),
      caseInsensitive:
        typeof value.caseInsensitive === 'boolean' ? value.caseInsensitive : true,
    };
  }
  if (value.type === 'frequencyReport') {
    const mode: FrequencyReportMode =
      value.mode === 'duplicates' || value.mode === 'nonDuplicates' ? value.mode : 'both';
    return {
      ...value,
      mode,
      showCount: typeof value.showCount === 'boolean' ? value.showCount : true,
    };
  }
  if (value.type === 'filterLines') {
    const mode: FilterLinesMode =
      value.mode === 'equals' ||
      value.mode === 'contains' ||
      value.mode === 'startsWith' ||
      value.mode === 'endsWith' ||
      value.mode === 'regex' ||
      value.mode === 'blank'
        ? value.mode
        : 'contains';
    const filterValue = typeof value.value === 'string' ? value.value : '';
    return {
      ...value,
      mode,
      value: filterValue,
      not: Boolean(value.not),
    };
  }
  if (value.type === 'caseConvert') {
    const mode: CaseConvertMode =
      value.mode === 'upper' || value.mode === 'title' || value.mode === 'sentense' ? value.mode : 'lower';
    return {
      ...value,
      mode,
    };
  }
  if (value.type === 'sort') {
    const mode: SortMode =
      value.mode === 'length' || value.mode === 'words' ? value.mode : 'lexical';
    return {
      ...value,
      reverse: Boolean(value.reverse),
      mode,
    };
  }
  if (value.type === 'split') {
    const splitChars = typeof value.splitChars === 'string' ? value.splitChars : ',';
    return {
      ...value,
      splitChars,
    };
  }
  if (value.type === 'join') {
    const joinString = typeof value.joinString === 'string' ? value.joinString : ',';
    const everyNLines =
      typeof value.everyNLines === 'number' && Number.isFinite(value.everyNLines) && value.everyNLines >= 0
        ? Math.floor(value.everyNLines)
        : 0;
    return {
      ...value,
      joinString,
      everyNLines,
    };
  }
  return value;
}

function buildPadChunk(padString: string, size: number): string {
  if (size <= 0) return '';
  const source = padString === '' ? ' ' : padString;
  return source.repeat(Math.ceil(size / source.length)).slice(0, size);
}

function truncateLine(
  line: string,
  options: { start: boolean; end: boolean; length: number; abbreviate: boolean }
): string {
  if (!options.start && !options.end) return line;
  if (line.length <= options.length) return line;
  if (options.length <= 0) return "";

  const dots = "...";

  if (options.start && options.end) {
    if (options.abbreviate) {
      if (options.length <= 6) return ".".repeat(options.length);
      const coreLength = options.length - 6;
      const removeCount = line.length - coreLength;
      const removeStart = Math.floor(removeCount / 2);
      const removeEnd = removeCount - removeStart;
      const core = line.slice(removeStart, line.length - removeEnd);
      return `${dots}${core}${dots}`;
    }

    const removeCount = line.length - options.length;
    const removeStart = Math.floor(removeCount / 2);
    const removeEnd = removeCount - removeStart;
    return line.slice(removeStart, line.length - removeEnd);
  }

  if (options.start) {
    if (options.abbreviate) {
      if (options.length <= 3) return ".".repeat(options.length);
      const keep = options.length - 3;
      return `${dots}${line.slice(line.length - keep)}`;
    }
    return line.slice(line.length - options.length);
  }

  if (options.abbreviate) {
    if (options.length <= 3) return ".".repeat(options.length);
    const keep = options.length - 3;
    return `${line.slice(0, keep)}${dots}`;
  }
  return line.slice(0, options.length);
}

function insertAt(line: string, value: string, index: number): string {
  const safeIndex = Math.max(0, Math.min(index, line.length));
  return `${line.slice(0, safeIndex)}${value}${line.slice(safeIndex)}`;
}

function getWordCount(line: string): number {
  if (!line.trim()) return 0;
  return line.trim().split(/\s+/).length;
}

function extractFromLine(
  line: string,
  options: {
    mode: ExtractMode;
    string: string;
    start: string;
    end: string;
    last: boolean;
    remove: boolean;
  }
): string {
  if (options.mode === 'numbers') {
    const matches = Array.from(line.matchAll(/\d+/g));
    if (matches.length === 0) return options.remove ? line : '';
    const selected = matches[0];
    const matchedValue = selected[0];
    const index = selected.index ?? line.indexOf(matchedValue);
    if (options.remove) {
      return `${line.slice(0, index)}${line.slice(index + matchedValue.length)}`;
    }
    return matchedValue;
  }

  if (options.mode === 'afterString') {
    if (!options.string) return options.remove ? line : '';
    const index = options.last ? line.lastIndexOf(options.string) : line.indexOf(options.string);
    if (index < 0) return options.remove ? line : '';
    const startIndex = index + options.string.length;
    if (options.remove) {
      return line.slice(0, startIndex);
    }
    return line.slice(startIndex);
  }

  if (options.mode === 'beforeString') {
    if (!options.string) return options.remove ? line : '';
    const index = options.last ? line.lastIndexOf(options.string) : line.indexOf(options.string);
    if (index < 0) return options.remove ? line : '';
    if (options.remove) {
      return line.slice(index);
    }
    return line.slice(0, index);
  }

  if (options.mode === 'regex') {
    if (!options.string) return options.remove ? line : '';
    try {
      const regex = new RegExp(options.string, 'g');
      const matches = Array.from(line.matchAll(regex));
      if (matches.length === 0) return options.remove ? line : '';
      const selected = matches[0];
      const matchedValue = selected[0];
      const index = selected.index ?? line.indexOf(matchedValue);
      if (options.remove) {
        return `${line.slice(0, index)}${line.slice(index + matchedValue.length)}`;
      }
      return matchedValue;
    } catch {
      return options.remove ? line : '';
    }
  }

  if (!options.start || !options.end) return options.remove ? line : '';
  const startIndex = line.indexOf(options.start);
  if (startIndex < 0) return options.remove ? line : '';
  const contentStart = startIndex + options.start.length;
  const endIndex = line.indexOf(options.end, contentStart);
  if (endIndex < 0) return options.remove ? line : '';
  if (options.remove) {
    return `${line.slice(0, contentStart)}${line.slice(endIndex)}`;
  }
  return line.slice(contentStart, endIndex);
}

function escapeRegexCharClass(text: string): string {
  return text.replace(/[\\\]-]/g, "\\$&");
}

function escapeRegexLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toTitleCase(value: string): string {
  return value.replace(/\S+/g, (word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

function toSentenseCase(value: string): string {
  const lower = value.toLowerCase();
  const index = lower.search(/[a-z]/i);
  if (index === -1) return lower;
  return `${lower.slice(0, index)}${lower.charAt(index).toUpperCase()}${lower.slice(index + 1)}`;
}

function matchesFilter(line: string, mode: FilterLinesMode, value: string): boolean {
  if (mode === 'blank') return line.trim().length === 0;
  if (!value) return true;

  if (mode === 'equals') return line === value;
  if (mode === 'contains') return line.includes(value);
  if (mode === 'startsWith') return line.startsWith(value);
  if (mode === 'endsWith') return line.endsWith(value);

  try {
    return new RegExp(value).test(line);
  } catch {
    return false;
  }
}

function buildFrequencyReport(
  lines: string[],
  options: {
    mode: FrequencyReportMode;
    showCount: boolean;
  },
): string {
  const stats = new Map<string, { count: number; firstIndex: number }>();

  lines.forEach((line, index) => {
    if (line === "") return;
    const existing = stats.get(line);
    if (existing) {
      existing.count += 1;
      return;
    }
    stats.set(line, { count: 1, firstIndex: index });
  });

  let entries = Array.from(stats.entries()).sort((a, b) => {
    const countDiff = b[1].count - a[1].count;
    if (countDiff !== 0) return countDiff;
    return a[1].firstIndex - b[1].firstIndex;
  });

  if (options.mode === 'duplicates') {
    entries = entries.filter(([, value]) => value.count > 1);
  } else if (options.mode === 'nonDuplicates') {
    entries = entries.filter(([, value]) => value.count === 1);
  }

  return entries
    .map(([line, value]) => (options.showCount ? `${line} (${value.count})` : line))
    .join('\n');
}

/**
 * Apply a single transformation to text
 */
function applyTransformation(text: string, transformation: Transformation): string {
  const lines = text.split('\n');
  
  switch (transformation.type) {
    case 'trim':
      {
        const normalized = normalizeTransformation(transformation);
        if (normalized.type !== 'trim') return text;
        return lines
          .map((line) => {
            if (normalized.trimStart && normalized.trimEnd) return line.trim();
            if (normalized.trimStart) return line.trimStart();
            if (normalized.trimEnd) return line.trimEnd();
            return line;
          })
          .join('\n');
      }

    case 'filterLines': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'filterLines') return text;
      return lines
        .filter((line) => {
          const match = matchesFilter(line, normalized.mode, normalized.value);
          return normalized.not ? !match : match;
        })
        .join('\n');
    }

    case 'caseConvert': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'caseConvert') return text;

      if (normalized.mode === 'upper') {
        return lines.map((line) => line.toUpperCase()).join('\n');
      }
      if (normalized.mode === 'title') {
        return lines.map((line) => toTitleCase(line)).join('\n');
      }
      if (normalized.mode === 'sentense') {
        return lines.map((line) => toSentenseCase(line)).join('\n');
      }
      return lines.map((line) => line.toLowerCase()).join('\n');
    }

    case 'pad': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'pad') return text;
      return lines
        .map((line) => {
          let next = line;
          if (normalized.padStart) {
            const missingStart = normalized.length - next.length;
            if (missingStart > 0) {
              next = `${buildPadChunk(normalized.padString, missingStart)}${next}`;
            }
          }
          if (normalized.padEnd) {
            const missingEnd = normalized.length - next.length;
            if (missingEnd > 0) {
              next = `${next}${buildPadChunk(normalized.padString, missingEnd)}`;
            }
          }
          return next;
        })
        .join('\n');
    }

    case 'truncate': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'truncate') return text;
      return lines.map((line) => truncateLine(line, normalized)).join('\n');
    }

    case 'extract': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'extract') return text;
      return lines
        .map((line) => extractFromLine(line, normalized))
        .join('\n');
    }

    case 'fill': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'fill') return text;
      return lines
        .map((line, index) => {
          let fillValue = normalized.text;
          if (normalized.mode === 'number') {
            const rawNumber = normalized.startNumber + index * normalized.step;
            fillValue = String(rawNumber);
            if (normalized.padLength > 0) {
              fillValue = fillValue.padStart(normalized.padLength, normalized.padChar);
            }
          }
          return insertAt(line, fillValue, normalized.fillAt);
        })
        .join('\n');
    }

    case 'split': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'split') return text;
      const delimiters = normalized.splitChars;
      if (!delimiters) return text;
      const pattern = new RegExp(`[${escapeRegexCharClass(delimiters)}]`);
      return lines
        .flatMap((line) => line.split(pattern))
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .join('\n');
    }

    case 'join': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'join') return text;
      if (normalized.everyNLines <= 0) {
        return lines.join(normalized.joinString);
      }

      const chunks: string[] = [];
      for (let index = 0; index < lines.length; index += normalized.everyNLines) {
        const chunk = lines.slice(index, index + normalized.everyNLines);
        chunks.push(chunk.join(normalized.joinString));
      }
      return chunks.join('\n');
    }

    case 'addPrefixSuffix': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'addPrefixSuffix') return text;
      return lines
        .map((line) => {
          const withPrefix =
            normalized.prefix && (!normalized.ifMissing || !line.startsWith(normalized.prefix))
              ? `${normalized.prefix}${line}`
              : line;
          return normalized.suffix && (!normalized.ifMissing || !withPrefix.endsWith(normalized.suffix))
            ? `${withPrefix}${normalized.suffix}`
            : withPrefix;
        })
        .join('\n');
    }

    case 'removePrefixSuffix': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'removePrefixSuffix') return text;
      return lines
        .map((line) => {
          let next = line;
          if (normalized.prefix && next.startsWith(normalized.prefix)) {
            next = next.slice(normalized.prefix.length);
          }
          if (normalized.suffix && next.endsWith(normalized.suffix)) {
            next = next.slice(0, next.length - normalized.suffix.length);
          }
          return next;
        })
        .join('\n');
    }

    case 'replace': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'replace') return text;
      if (normalized.find === '') return text;
      const flags = `${normalized.all ? 'g' : ''}${normalized.caseInsensitive ? 'i' : ''}`;

      if (normalized.mode === 'regex') {
        try {
          const regex = new RegExp(normalized.find, flags);
          return text.replace(regex, normalized.replaceWith);
        } catch {
          return text;
        }
      }

      const literalRegex = new RegExp(
        escapeRegexLiteral(normalized.find),
        flags
      );
      return text.replace(literalRegex, normalized.replaceWith);
    }

    case 'frequencyReport': {
      const normalized = normalizeTransformation(transformation);
      if (normalized.type !== 'frequencyReport') return text;
      return buildFrequencyReport(lines, {
        mode: normalized.mode,
        showCount: normalized.showCount,
      });
    }
    
    case 'dedupe':
      return Array.from(new Set(lines)).join('\n');
    
    case 'sort':
      {
        const normalized = normalizeTransformation(transformation);
        if (normalized.type !== 'sort') return text;

        const sorted = [...lines].sort((left, right) => {
          if (normalized.mode === 'length') {
            const diff = left.length - right.length;
            if (diff !== 0) return diff;
            return left.localeCompare(right);
          }
          if (normalized.mode === 'words') {
            const diff = getWordCount(left) - getWordCount(right);
            if (diff !== 0) return diff;
            return left.localeCompare(right);
          }
          return left.localeCompare(right);
        });

        if (normalized.reverse) {
          sorted.reverse();
        }

        return sorted.join('\n');
      }
    
    case 'shuffle':
      // Fisher-Yates shuffle
      const shuffled = [...lines];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.join('\n');

    case 'removeBlankLines':
      return lines.filter((line) => line.trim() !== '').join('\n');
    
    default:
      return text;
  }
}

/**
 * Apply series of transformations to text in order
 */
export function processText(
  text: string,
  transformations: Transformation[]
): string {
  if (!text.trim() || transformations.length === 0) {
    return text;
  }

  let result = text;
  
  for (const transformation of transformations) {
    result = applyTransformation(result, transformation);
  }
  
  return result;
}

/**
 * Get display name for transformation
 */
export function getTransformationName(type: TransformationType): string {
  const names: Record<TransformationType, string> = {
    trim: 'Trim',
    pad: 'Pad',
    truncate: 'Truncate',
    extract: 'Extract',
    fill: 'Fill',
    split: 'Split',
    join: 'Join',
    addPrefixSuffix: 'Add Prefix/Suffix',
    removePrefixSuffix: 'Remove Prefix/Suffix',
    replace: 'Replace',
    caseConvert: 'Convert Case',
    filterLines: 'Filter Lines',
    frequencyReport: 'Frequency Report',
    dedupe: 'Dedupe',
    sort: 'Sort',
    shuffle: 'Shuffle',
    removeBlankLines: 'Remove Blank Lines',
  };
  return names[type];
}
