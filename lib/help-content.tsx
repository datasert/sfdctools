"use client";

import { ReactNode } from "react";

export interface HelpContent {
  title: string;
  content: ReactNode;
}

export const helpContent: Record<string, HelpContent> = {
  "id-converter": {
    title: "Convert IDs",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Convert Salesforce IDs between 15-character and 18-character formats. The tool supports batch conversion, processing each line independently.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>15 → 18:</strong> Expands 15-character IDs to 18-character format</li>
            <li><strong>18 → 15:</strong> Trims 18-character IDs back to 15-character format</li>
            <li><strong>Batch processing:</strong> Process multiple IDs, one per line</li>
            <li><strong>Error handling:</strong> Invalid IDs are passed through unchanged with error details shown</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste your Salesforce IDs (one per line) in the input pane. The conversion happens automatically as you type. Use the Swap button to exchange input and output, or Clear All to reset both panes.
          </p>
        </div>
      </div>
    ),
  },
  "extract-ids": {
    title: "Extract IDs",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Extract valid Salesforce IDs from pasted text and group them by object using the first three characters of each ID. Unknown prefixes are grouped separately under Unknown.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Auto extraction:</strong> Pulls 15-character and 18-character Salesforce IDs from mixed text.</li>
            <li><strong>Group by object:</strong> Groups IDs by object name using the ID prefix, with an Unknown bucket for unmapped prefixes.</li>
            <li><strong>Convert to 18 chars:</strong> Normalizes extracted 15-character IDs to the 18-character format.</li>
            <li><strong>Copy output:</strong> Copy the extracted result to the clipboard.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste any text into the input pane. The extracted IDs appear automatically in the output pane. Use the toggles to group results by object or normalize IDs to 18 characters.
          </p>
        </div>
      </div>
    ),
  },
  "soql-formatter": {
    title: "SOQL Formatter",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Format and beautify SOQL (Salesforce Object Query Language) queries with customizable options. The tool formats queries as you type.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Line Width:</strong> Set the maximum line width for formatting (default: 150 characters)</li>
            <li><strong>Keywords Uppercase:</strong> Automatically convert SQL keywords to uppercase (default: enabled)</li>
            <li><strong>Select Field in New Line:</strong> Place each SELECT field on a new line</li>
            <li><strong>Child Query in New Line:</strong> Format child queries (subqueries) with each element on a new line</li>
            <li><strong>Clause in New Line:</strong> Place each clause (FROM, WHERE, GROUP BY, etc.) on a new line</li>
            <li><strong>Where Condition in New Line:</strong> Place each WHERE condition on a new line</li>
            <li><strong>Real-time formatting:</strong> Formats as you type</li>
            <li><strong>Error display:</strong> Shows formatting errors if the query is invalid</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your SOQL query in the input pane. The formatted output appears in the bottom pane automatically. Adjust the line width and keyword casing options as needed.
          </p>
        </div>
      </div>
    ),
  },
  "formula-formatter": {
    title: "Formula Formatter",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Format and beautify Salesforce formulas with customizable options. The tool formats formulas as you type.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Line Width:</strong> Set the maximum line width for formatting (default: 150 characters)</li>
            <li><strong>Keywords Uppercase:</strong> Automatically convert formula keywords to uppercase (default: enabled)</li>
            <li><strong>Real-time formatting:</strong> Formats as you type</li>
            <li><strong>Error display:</strong> Shows parsing errors if the formula is invalid</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your Salesforce formula in the input pane. The formatted output appears in the bottom pane automatically. Adjust the line width and keyword casing options as needed.
          </p>
        </div>
      </div>
    ),
  },
  "in-clause-generator": {
    title: "IN Clause Generator",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Generate Salesforce SOQL IN clause strings from a list of values. Supports various formatting and processing options.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Dedupe:</strong> Remove duplicate values (default: enabled)</li>
            <li><strong>Sorted:</strong> Sort values alphabetically (default: disabled)</li>
            <li><strong>Max Values per Line:</strong> Number of values per line in the output (default: 5)</li>
            <li><strong>Quoted:</strong> Wrap values in single quotes (default: enabled)</li>
            <li><strong>Split After:</strong> Split into multiple IN clauses after specified number of values</li>
            <li><strong>Quote Escaping:</strong> Automatically escapes single quotes in values when quoted</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste your values (one per line or comma-separated) in the input pane. The IN clause is generated automatically. Both input and output panes are editable, so you can fine-tune the result.
          </p>
        </div>
      </div>
    ),
  },
  "text-tool": {
    title: "Text Tool",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Apply a series of text transformations in customizable order. Most operations work line-by-line and support per-operation options.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Available Transformations</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Trim:</strong> Trim start/end whitespace with toggles for Start and End.</li>
            <li><strong>Pad:</strong> Pad at Start/End with configurable length and pad text.</li>
            <li><strong>Truncate:</strong> Truncate from Start/End with optional ellipsis abbreviation.</li>
            <li><strong>Extract:</strong> Extract by Numbers, Between, After String, Before String, or Regex. Supports Last (for before/after) and Remove mode.</li>
            <li><strong>Extract IDs:</strong> Pull Salesforce IDs from mixed text, with options to group by object and convert to 18-character format.</li>
            <li><strong>Fill:</strong> Insert text/number at a character index. Number mode supports start, step, pad length, and pad char.</li>
            <li><strong>Split:</strong> Split lines by each delimiter character provided.</li>
            <li><strong>Join:</strong> Join with a delimiter, optionally every N lines.</li>
            <li><strong>Add Prefix/Suffix:</strong> Add prefix/suffix with optional If Missing behavior.</li>
            <li><strong>Remove Prefix/Suffix:</strong> Remove matching prefix/suffix when present.</li>
            <li><strong>Replace:</strong> Text/Regex replace with All and Case Insensitive options.</li>
            <li><strong>Convert Case:</strong> Lower, Upper, Title, or Sentense mode.</li>
            <li><strong>Filter Lines:</strong> Equals, Contains, Starts With, Ends With, Regex, or Blank with Not inversion.</li>
            <li><strong>Frequency Report:</strong> Count occurrences for Both, Duplicates, or Non Duplicates.</li>
            <li><strong>Dedupe:</strong> Remove duplicate lines.</li>
            <li><strong>Sort:</strong> Sort with Lexical, Length, or Words mode, plus Reverse option.</li>
            <li><strong>Shuffle:</strong> Randomly shuffle lines.</li>
            <li><strong>Remove Blank Lines:</strong> Remove empty/whitespace-only lines.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Add transformations from the dropdown and click "Add". Transformations are applied in the order shown. Use the up/down arrows to reorder transformations, remove individual transformations with X, or use Remove All. Both input and output panes are editable.
          </p>
        </div>
      </div>
    ),
  },
  "slds-icons": {
    title: "SLDS Icons",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Browse and search all available Salesforce Lightning Design System icons. Copy icon names, SVG code, or download icons in various formats.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Category Filter:</strong> Filter icons by category</li>
            <li><strong>Search:</strong> Search icons by name</li>
            <li><strong>Icon Size:</strong> Adjust icon display size (xx-small, x-small, small, medium, large)</li>
            <li><strong>Copy Options:</strong> Copy icon name, LWC code, or SVG code</li>
            <li><strong>Download:</strong> Download icons as SVG or PNG</li>
            <li><strong>Hover Actions:</strong> Hover over an icon to see action options</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Use the category dropdown and search box to find icons. Click an icon to copy its name. Hover over an icon to see additional options like copying LWC code, SVG code, or downloading the icon.
          </p>
        </div>
      </div>
    ),
  },
  "slds-styling-hooks": {
    title: "SLDS Styling Hooks",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Search and browse Salesforce Lightning Design System styling hooks with live type-based previews. Copy hook names, computed color values, and ready-to-use CSS usage snippets.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Type Filters:</strong> Filter hooks by preview type (Color, Spacing, Radius, Shadow, Typography, and more).</li>
            <li><strong>Search:</strong> Search by hook name, token name, value, comment, category, preview type, and CSS property.</li>
            <li><strong>Live Previews:</strong> Preview each hook in a visual card tailored to its type.</li>
            <li><strong>Color Conversions:</strong> Color hooks display HEX, RGB, and HSL formats when parseable.</li>
            <li><strong>Usage Snippets:</strong> Each card includes generated usage lines such as <code>color: var(--slds-g-color-...)</code>.</li>
            <li><strong>One-click Copy:</strong> Copy hook names and usage snippets directly from each card.</li>
            <li><strong>Persistent Filters:</strong> Search text and selected filter types are persisted for convenience.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Use type chips at the top to narrow results, then search for specific hooks. Click a card (or hook name) to copy the CSS variable, and use the Usage section in each card to copy ready-to-paste CSS declarations.
          </p>
        </div>
      </div>
    ),
  },
  "slds-css-classes": {
    title: "SLDS CSS Classes",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Explore SLDS utility CSS classes with searchable declarations, utility/type filters, preview cards, and copy-ready usage snippets.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Utility Filters:</strong> Filter by utility groups (for example spacing, typography, layout, and more).</li>
            <li><strong>Type Filters:</strong> Filter by preview type (Color, Spacing, Typography, Border, Shadow, Sizing, Layout).</li>
            <li><strong>Search:</strong> Search by class name, utility, preview type, summary text, CSS property, and value.</li>
            <li><strong>Visual Previews:</strong> See class behavior in context-specific preview cards.</li>
            <li><strong>Declaration View:</strong> Inspect key declarations for each class directly in the card.</li>
            <li><strong>Copy Support:</strong> Copy class names and example usage snippets with one click.</li>
            <li><strong>Persistent Filters:</strong> Search and filter selections are persisted between sessions.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Start with utility or type filters, then refine with search. Click a class card to copy the class name, or use the Usage section to copy a scaffold like <code>&lt;div class="slds-..."&gt;...&lt;/div&gt;</code>.
          </p>
        </div>
      </div>
    ),
  },
  "slds-colors": {
    title: "SLDS Colors",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Browse SLDS color hooks as grouped swatches. Quickly inspect and copy hook names and common color formats (HEX/RGB/HSL), along with CSS usage snippets.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Sectioned Palette:</strong> Colors are grouped into sections like palette, system, surface, accent, feedback, border, and transparent.</li>
            <li><strong>Grouped Swatches:</strong> Related color variants are grouped for easier comparison.</li>
            <li><strong>Search:</strong> Search by hook var, token name, group/category, original value, resolved value, or color formats.</li>
            <li><strong>Hover Details:</strong> Hover/focus a swatch to open a detail popover.</li>
            <li><strong>Copy Actions:</strong> Copy hook name, HEX, RGB, HSL, or usage line directly from the popover.</li>
            <li><strong>Keyboard Support:</strong> Swatches are keyboard focusable and copy on Enter/Space.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Use search to narrow colors, then click a swatch to copy the hook name. Hover a swatch to copy HEX/RGB/HSL values or a usage snippet such as <code>color: var(--slds-g-color-...);</code>.
          </p>
        </div>
      </div>
    ),
  },
  "datetime-converter": {
    title: "DateTime Converter",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Convert and format dates and times across multiple formats. View the current time in various formats or create custom datetime cards with timezone support and time offsets.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Current Time Display:</strong> Real-time display of current time in multiple formats</li>
            <li><strong>Multiple Formats:</strong> View dates in formatted strings, ISO format, and Unix timestamps</li>
            <li><strong>Timezone Support:</strong> Display times in any timezone (defaults to browser timezone)</li>
            <li><strong>Input Types:</strong> Current Time, Unix Seconds, Unix Milliseconds, ISO UTC, ISO User Timezone</li>
            <li><strong>Time Offsets:</strong> Add or subtract time using casual format (e.g., "5h", "-5h", "-5h 3m")</li>
            <li><strong>Copy to Clipboard:</strong> Click any format line to copy its value</li>
            <li><strong>Multiple Cards:</strong> Create multiple datetime cards for different times and timezones</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Time Offset Format</h3>
          <p className="text-[var(--text-secondary)] mb-2">
            Use casual format to add or subtract time. Supported units:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>y:</strong> years</li>
            <li><strong>q:</strong> quarters (3 months)</li>
            <li><strong>M:</strong> months</li>
            <li><strong>w:</strong> weeks</li>
            <li><strong>d:</strong> days</li>
            <li><strong>h:</strong> hours</li>
            <li><strong>m:</strong> minutes</li>
            <li><strong>s:</strong> seconds</li>
          </ul>
          <p className="text-[var(--text-secondary)] mt-2">
            Examples: "5h", "-5h", "-5h 3m", "2d 3h", "1y 6M"
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            The top section shows the current time in all formats. Click any format line to copy it. Use "Add Card" to create custom datetime cards. Each card allows you to input a time in various formats, select a timezone, and optionally add time offsets. Cards are displayed two per row on larger screens.
          </p>
        </div>
      </div>
    ),
  },
  "json-formatter": {
    title: "JSON Formatter",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Format and beautify JSON (JavaScript Object Notation) with customizable indentation. The tool validates JSON and formats it as you type.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Indentation:</strong> Set the number of spaces for indentation (default: 2, range: 0-10)</li>
            <li><strong>Real-time formatting:</strong> Formats as you type</li>
            <li><strong>JSON validation:</strong> Validates JSON syntax and shows errors if invalid</li>
            <li><strong>Error display:</strong> Shows detailed error messages for invalid JSON</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your JSON in the left pane. The formatted output appears in the right pane automatically. Adjust the indentation setting as needed. Use the Swap button to exchange input and output, or Clear All to reset both panes.
          </p>
        </div>
      </div>
    ),
  },
  "json-diff": {
    title: "JSON Diff",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Compare two JSON documents side-by-side with optional cleanup rules applied before diffing. The cleaned outputs are rendered in a Monaco diff view for easier review.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Two-way JSON Input:</strong> Edit left and right JSON independently in Monaco editors.</li>
            <li><strong>Cleanup Options:</strong> Configure cleanup behavior from the JSON Cleanup dialog before comparison.</li>
            <li><strong>Indent Control:</strong> Choose output indentation (0-10 spaces) for cleaned JSON formatting.</li>
            <li><strong>Live Diff:</strong> Diff output updates automatically as input or cleanup settings change.</li>
            <li><strong>Editable Side Labels:</strong> Rename left/right headers in the diff view for context.</li>
            <li><strong>Actions:</strong> Swap sides, clear both inputs, and copy cleaned right JSON.</li>
            <li><strong>Error Reporting:</strong> Shows parse errors when either JSON input is invalid.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste JSON into both editors, set indentation and cleanup options, then review the cleaned diff below. Use Swap to reverse comparison direction, and use Copy to export the cleaned right-side JSON.
          </p>
        </div>
      </div>
    ),
  },
  "metadata-registry": {
    title: "Metadata Types",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Browse the Source Deploy Retrieve metadata registry in a grid. The table is loaded at runtime through a CORS proxy and shows the metadata type, directory, file extension suffix, and folder flags.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Columns</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Type:</strong> Metadata type name from the registry.</li>
            <li><strong>Directory:</strong> Registry directory name used on disk.</li>
            <li><strong>File Extn:</strong> Metadata file suffix used for the type.</li>
            <li><strong>In Folder:</strong> Indicates whether the type is stored in a folder.</li>
            <li><strong>Strict Directory:</strong> Indicates whether the directory name is enforced exactly.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Use the search box and built-in grid filters to narrow the registry. Click Refresh to re-fetch the upstream JSON through the proxy.
          </p>
        </div>
      </div>
    ),
  },
  "xml-formatter": {
    title: "XML Formatter",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Format and beautify XML (eXtensible Markup Language) with customizable indentation. The tool validates XML and formats it as you type.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Indentation:</strong> Set the number of spaces for indentation (default: 2, range: 0-10)</li>
            <li><strong>Real-time formatting:</strong> Formats as you type</li>
            <li><strong>XML validation:</strong> Validates XML syntax and shows errors if invalid</li>
            <li><strong>Error display:</strong> Shows detailed error messages for invalid XML</li>
            <li><strong>Attribute formatting:</strong> Properly formats XML attributes</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your XML in the left pane. The formatted output appears in the right pane automatically. Adjust the indentation setting as needed. Use the Swap button to exchange input and output, or Clear All to reset both panes.
          </p>
        </div>
      </div>
    ),
  },
  "xml-diff": {
    title: "XML Diff",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Compare two XML documents side-by-side with optional cleanup rules applied before diffing. The normalized XML is rendered in a Monaco diff view for easier review.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Two-way XML Input:</strong> Edit left and right XML independently in Monaco editors.</li>
            <li><strong>Cleanup Options:</strong> Configure trim, comment removal, attribute sorting, and tag sorting before comparison.</li>
            <li><strong>Indent Control:</strong> Choose output indentation (0-10 spaces) for normalized XML formatting.</li>
            <li><strong>Live Diff:</strong> Diff output updates automatically as input or cleanup settings change.</li>
            <li><strong>Editable Side Labels:</strong> Rename left and right headers in the diff view for context.</li>
            <li><strong>Actions:</strong> Swap sides, clear both inputs, load a sample, and copy cleaned right XML.</li>
            <li><strong>Error Reporting:</strong> Shows parse errors when either XML input is invalid.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste XML into both editors, open XML Cleanup to choose normalization rules, and review the cleaned diff below. Enable Sort Tags to compare sibling elements in a stable order and use Copy to export the cleaned right-side XML.
          </p>
        </div>
      </div>
    ),
  },
  "json-to-apex": {
    title: "JSON to Apex",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Convert JSON structure to Apex class code with inner classes. Automatically analyzes the JSON structure and generates Apex code that represents the same data shape.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Automatic Type Detection:</strong> Infers Apex types from JSON values (String, Integer, Decimal, Boolean, Date, DateTime)</li>
            <li><strong>Nested Objects:</strong> Creates inner classes for nested JSON objects</li>
            <li><strong>Array Support:</strong> Converts JSON arrays to Apex List types</li>
            <li><strong>Root Class Name:</strong> Customize the name of the root Apex class</li>
            <li><strong>Indentation:</strong> Set the indentation size for generated code (default: 4 spaces)</li>
            <li><strong>@AuraEnabled:</strong> Add @AuraEnabled annotation to all properties for Lightning Web Components</li>
            <li><strong>Real-time Generation:</strong> Generates Apex code as you type</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Supported Types</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>String:</strong> Text values and strings that don't match date patterns</li>
            <li><strong>Integer:</strong> Whole numbers</li>
            <li><strong>Decimal:</strong> Decimal numbers</li>
            <li><strong>Boolean:</strong> true/false values</li>
            <li><strong>Date:</strong> Strings matching YYYY-MM-DD format</li>
            <li><strong>DateTime:</strong> Strings matching date-time patterns</li>
            <li><strong>List:</strong> JSON arrays are converted to List types</li>
            <li><strong>Inner Classes:</strong> Nested objects become inner classes</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your JSON in the left pane. The tool will automatically analyze the structure and generate Apex class code in the right pane. Customize the root class name and indentation as needed. The generated code includes inner classes for nested objects and proper type mappings for arrays and primitives.
          </p>
        </div>
      </div>
    ),
  },
  "base64-encoder": {
    title: "Base64 Encoder/Decoder",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Encode text to Base64 format or decode Base64 strings back to text. The tool supports real-time conversion as you type.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Encode:</strong> Convert plain text to Base64 encoding</li>
            <li><strong>Decode:</strong> Convert Base64 strings back to plain text</li>
            <li><strong>Real-time conversion:</strong> Converts as you type</li>
            <li><strong>Mode switching:</strong> Easily switch between encode and decode modes</li>
            <li><strong>Swap functionality:</strong> Swap input and output, automatically toggling the mode</li>
            <li><strong>Error handling:</strong> Shows clear error messages for invalid Base64 strings</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Select "Encode" to convert text to Base64, or "Decode" to convert Base64 to text. Paste or type your input in the left pane, and the converted output appears in the right pane automatically. Use the Swap button to exchange input and output, which will also toggle the mode automatically.
          </p>
        </div>
      </div>
    ),
  },
  "url-encoder": {
    title: "URL Encoder/Decoder",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Encode text to URL-encoded format (percent encoding) or decode URL-encoded strings back to text. The tool also parses complete URLs and displays detailed information about their components.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Encode:</strong> Convert text to URL-encoded format (percent encoding)</li>
            <li><strong>Decode:</strong> Convert URL-encoded strings back to plain text</li>
            <li><strong>Real-time conversion:</strong> Converts as you type</li>
            <li><strong>URL Parsing:</strong> Automatically parses complete URLs and displays components</li>
            <li><strong>Parsed Details:</strong> Shows protocol, host, hostname, port, pathname, hash, origin, and query parameters</li>
            <li><strong>Query Parameters:</strong> Displays all query parameters in a readable format</li>
            <li><strong>Mode switching:</strong> Easily switch between encode and decode modes</li>
            <li><strong>Swap functionality:</strong> Swap input and output, automatically toggling the mode</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Select "Encode" to convert text to URL-encoded format, or "Decode" to convert URL-encoded strings to text. Paste or type your input in the left pane, and the converted output appears in the right pane automatically. When you enter a complete URL (in either mode), the parsed URL details will appear at the bottom, showing all components including query parameters.
          </p>
        </div>
      </div>
    ),
  },
  "html-formatter": {
    title: "HTML Formatter",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Format and beautify HTML (HyperText Markup Language) with customizable indentation. The tool validates HTML and formats it as you type. Optionally preview the rendered HTML output.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Indentation:</strong> Set the number of spaces for indentation (default: 2, range: 0-10)</li>
            <li><strong>Real-time formatting:</strong> Formats as you type</li>
            <li><strong>HTML validation:</strong> Validates HTML syntax and shows errors if invalid</li>
            <li><strong>Error display:</strong> Shows detailed error messages for invalid HTML</li>
            <li><strong>Attribute formatting:</strong> Properly formats HTML attributes</li>
            <li><strong>Preview mode:</strong> Optionally show a live preview of the rendered HTML</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your HTML in the left pane. The formatted output appears in the right pane automatically. Adjust the indentation setting as needed. Enable "Show Preview" to see a live preview of the rendered HTML at the bottom. Use the Swap button to exchange input and output, or Clear All to reset both panes.
          </p>
        </div>
      </div>
    ),
  },
  "device-information": {
    title: "Device Information",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            View comprehensive information about your browser, device, screen, and network. This tool displays all available information from the browser's Navigator API and Screen API.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Information Displayed</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Browser Information:</strong> Browser name, version, vendor, language, user agent, cookie status, online status</li>
            <li><strong>Device Information:</strong> Platform, CPU cores, touch points, timezone, timezone offset</li>
            <li><strong>Screen Information:</strong> Screen dimensions, available dimensions, color depth, pixel depth, orientation</li>
            <li><strong>Network Information:</strong> Connection type, effective type, downlink speed, round-trip time (if available)</li>
            <li><strong>External IP:</strong> Your public IP address (requires external API call)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Privacy Note</h3>
          <p className="text-[var(--text-secondary)]">
            Most information is collected locally from your browser. The external IP address requires a request to a public IP detection service. Click on any value to copy it to your clipboard.
          </p>
        </div>
      </div>
    ),
  },
  "text-diff": {
    title: "Text Diff",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Compare two texts side-by-side and view their differences. The tool provides a visual diff view showing additions, deletions, and modifications with color-coded highlighting.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Side-by-side comparison:</strong> View original and modified texts in separate panes</li>
            <li><strong>Visual diff view:</strong> See differences highlighted with colors (additions, deletions, modifications)</li>
            <li><strong>Real-time comparison:</strong> Diff updates as you type in either pane</li>
            <li><strong>Line-by-line comparison:</strong> Differences are shown line by line for easy identification</li>
            <li><strong>Copy functionality:</strong> Copy original or modified text separately</li>
            <li><strong>Copy Diffs:</strong> Copy the lines missing from the left side and the lines missing from the right side to the clipboard</li>
            <li><strong>Swap texts:</strong> Exchange original and modified texts</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Enter or paste your original text in the left pane and the modified text in the right pane. The diff view at the bottom will automatically show the differences. Green highlights indicate additions, red indicates deletions, and blue indicates modifications. Use the copy buttons to copy either full text, or use Copy Diffs to copy only the lines missing on each side to the clipboard. Swap reverses the comparison.
          </p>
        </div>
      </div>
    ),
  },
  "omni-config-diff": {
    title: "Omni Config XML Diff",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Compare two Salesforce OmniScript XML configs with a cleanup step that makes embedded JSON and email body content easier to diff.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>Side-by-side XML input:</strong> Paste left and right config XML at the top</li>
            <li><strong>Editable source labels:</strong> Name each side inline so the source/version is clear</li>
            <li><strong>Decode Json:</strong> Decode and normalize embedded JSON blocks for cleaner diffs</li>
            <li><strong>Decode Email Body:</strong> Decode HTML entities in <code>emailBody</code> and expand escaped newlines/tabs for readability</li>
            <li><strong>Monaco diff:</strong> Cleaned output is shown in a read-only diff editor with wrapping on both sides</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste your two XML files, set labels for left/right sources, and choose decode options. Keep both decode options enabled for the most readable review, or turn off Decode Json to view raw input as-is. The lower diff pane updates automatically.
          </p>
        </div>
      </div>
    ),
  },
  "jwt-decoder": {
    title: "JWT Decoder",
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Overview</h3>
          <p className="text-[var(--text-secondary)]">
            Decode JSON Web Tokens (JWT) and view the header, payload, and signature components. Optionally verify the token signature using a secret key.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
            <li><strong>JWT Decoding:</strong> Automatically decodes JWT tokens into header, payload, and signature</li>
            <li><strong>Header Display:</strong> Shows the JWT header (algorithm, token type, etc.) in formatted JSON</li>
            <li><strong>Payload Display:</strong> Shows the JWT payload (claims, data, etc.) in formatted JSON</li>
            <li><strong>Signature Display:</strong> Shows the token signature</li>
            <li><strong>Signature Verification:</strong> Verify token signature using HMAC-SHA256 (HS256) algorithm</li>
            <li><strong>Real-time Decoding:</strong> Decodes as you type or paste the token</li>
            <li><strong>Copy Functionality:</strong> Copy header, payload, or signature individually</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Usage</h3>
          <p className="text-[var(--text-secondary)]">
            Paste or type your JWT token in the input pane. The tool will automatically decode it and display the header and payload in separate panes. The signature is shown at the bottom. To verify the signature, enter the secret key used to sign the token. The verification status will be displayed in the settings bar.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Supported Algorithms</h3>
          <p className="text-[var(--text-secondary)]">
            Currently supports HMAC-SHA256 (HS256) for signature verification. Other algorithms may be decoded but cannot be verified.
          </p>
        </div>
      </div>
    ),
  },
};
