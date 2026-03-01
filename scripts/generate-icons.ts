import fs from "fs";
import path from "path";
import { buildSldsIconsData } from "../lib/slds-icons-data";

const OUTPUT_FILE = path.join(process.cwd(), "public", "icons-data.json");

function writeIconsData() {
  const { icons, categories } = buildSldsIconsData();

  const payload = {
    icons,
    categories,
    generatedAt: new Date().toISOString(),
    source: "public/slds-icons/raw/ui.icons.json",
  };

  const publicDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`Generated icons data: ${icons.length} icons, ${categories.length} categories`);
  console.log(`Output: ${OUTPUT_FILE}`);

  if (icons.length === 0) {
    console.warn(
      "No icons were generated. Ensure raw SLDS files exist under public/slds-icons/raw."
    );
  }
}

writeIconsData();

