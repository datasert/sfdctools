import fs from "fs";
import path from "path";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listUtilityDirectories(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function parseAnnotationBlocks(content) {
  const blocks = [];
  const blockRegex = /\/\*\*([\s\S]*?)\*\//g;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    const raw = match[1];
    const lines = raw
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").trim())
      .filter((line) => line.length > 0);

    const selectors = [];
    let summary = "";
    let group = "";

    for (const line of lines) {
      if (line.startsWith("@selector")) {
        const value = line.replace(/^@selector\s*/, "").trim();
        if (value) {
          selectors.push(...value.split(",").map((part) => part.trim()).filter(Boolean));
        }
        continue;
      }

      if (line.startsWith("@summary")) {
        summary = line.replace(/^@summary\s*/, "").trim();
        continue;
      }

      if (line.startsWith("@group")) {
        group = line.replace(/^@group\s*/, "").trim();
        continue;
      }

      if (!line.startsWith("@") && !summary) {
        summary = line;
      }
    }

    if (selectors.length > 0 || summary || group) {
      blocks.push({
        selectors,
        summary,
        group,
      });
    }
  }

  return blocks;
}

function selectorPatternToRegex(selectorPattern) {
  const escaped = selectorPattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[\\w-]+");
  return new RegExp(`^${escaped}$`);
}

function parseRuleBlocks(content) {
  const stripped = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(stripped)) !== null) {
    const selectorSource = match[1].trim();
    const body = match[2];
    if (!selectorSource || selectorSource.startsWith("@")) {
      continue;
    }

    const selectors = selectorSource
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) => selector.split(":")[0].trim())
      .filter((selector) => /^\.[A-Za-z0-9_-]+$/.test(selector));

    if (selectors.length === 0) {
      continue;
    }

    const declarations = [];
    const declRegex = /([a-zA-Z-]+)\s*:\s*([^;{}]+);/g;
    let declMatch;
    while ((declMatch = declRegex.exec(body)) !== null) {
      const property = declMatch[1].trim();
      const value = declMatch[2].trim();
      if (!property || !value) {
        continue;
      }
      declarations.push({ property, value });
    }

    blocks.push({ selectors, declarations });
  }

  return blocks;
}

function inferPreviewType(className, declarations) {
  const props = declarations.map((decl) => decl.property.toLowerCase());
  const hasProp = (value) => props.some((prop) => prop.includes(value));
  const lc = className.toLowerCase();

  if (hasProp("color") || hasProp("fill") || hasProp("stroke") || lc.includes("color")) {
    return "Color";
  }
  if (hasProp("margin") || hasProp("padding") || lc.includes("m-") || lc.includes("p-")) {
    return "Spacing";
  }
  if (hasProp("font") || hasProp("line-height") || hasProp("text") || lc.includes("text")) {
    return "Typography";
  }
  if (hasProp("border") || hasProp("radius")) {
    return "Border";
  }
  if (hasProp("shadow")) {
    return "Shadow";
  }
  if (hasProp("width") || hasProp("height") || hasProp("size") || lc.includes("size")) {
    return "Sizing";
  }
  if (
    hasProp("display") ||
    hasProp("position") ||
    hasProp("overflow") ||
    hasProp("float") ||
    hasProp("flex") ||
    hasProp("grid") ||
    hasProp("align") ||
    hasProp("justify") ||
    hasProp("visibility")
  ) {
    return "Layout";
  }
  return "Generic";
}

function extractUtilitySummary(docContent) {
  const blocks = parseAnnotationBlocks(docContent);
  for (const block of blocks) {
    if (block.summary) {
      return block.summary;
    }
  }
  return "";
}

function main() {
  const defaultSourceRoot = "/Users/brsanthu/projects/datasert/gitworkspace/design-system/ui/utilities";
  const sourceRoot = process.argv[2] || defaultSourceRoot;
  const outputPath =
    process.argv[3] ||
    path.resolve(process.cwd(), "public/slds-css-classes/classes.json");

  if (!fs.existsSync(sourceRoot)) {
    console.error(`Source path does not exist: ${sourceRoot}`);
    process.exit(1);
  }

  const items = [];
  const utilityDirs = listUtilityDirectories(sourceRoot);

  for (const utility of utilityDirs) {
    const utilityDir = path.join(sourceRoot, utility);
    const indexPath = path.join(utilityDir, "_index.scss");
    if (!fs.existsSync(indexPath)) {
      continue;
    }

    const docPath = path.join(utilityDir, "_doc.scss");
    const utilitySummary = fs.existsSync(docPath)
      ? extractUtilitySummary(readText(docPath))
      : "";

    const indexContent = readText(indexPath);
    const annotationBlocks = parseAnnotationBlocks(indexContent);
    const ruleBlocks = parseRuleBlocks(indexContent);

    for (const rule of ruleBlocks) {
      for (const selector of rule.selectors) {
        if (!selector.startsWith(".slds-")) {
          continue;
        }

        const annotation =
          annotationBlocks.find(
            (block) =>
              block.selectors.includes(selector) ||
              block.selectors.some((pattern) => {
                if (!pattern.includes("*")) {
                  return false;
                }
                try {
                  return selectorPatternToRegex(pattern).test(selector);
                } catch {
                  return false;
                }
              })
          ) || null;

        const className = selector.replace(/^\./, "");
        const previewType = inferPreviewType(className, rule.declarations);

        items.push({
          utility,
          className,
          selector,
          summary: (annotation && annotation.summary) || utilitySummary || "",
          group: (annotation && annotation.group) || "",
          declarations: rule.declarations,
          previewType,
        });
      }
    }
  }

  const deduped = Array.from(
    new Map(items.map((item) => [item.className, item])).values()
  ).sort((a, b) => {
    if (a.utility !== b.utility) {
      return a.utility.localeCompare(b.utility);
    }
    return a.className.localeCompare(b.className);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    total: deduped.length,
    items: deduped,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${deduped.length} classes to ${outputPath}`);
}

main();
