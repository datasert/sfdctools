import fs from "fs";
import path from "path";

/**
 * Script to prepare Next.js build output for Chrome extension
 * This copies manifest.json and ensures proper structure
 */

const OUT_DIR = path.join(process.cwd(), "out");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const MANIFEST_SRC = path.join(PUBLIC_DIR, "manifest.json");
const MANIFEST_DEST = path.join(OUT_DIR, "manifest.json");

console.log("Preparing Chrome extension build...");

// Ensure out directory exists
if (!fs.existsSync(OUT_DIR)) {
  console.error("Error: 'out' directory not found. Please run 'next build' first.");
  process.exit(1);
}

// Copy manifest.json to out directory
if (fs.existsSync(MANIFEST_SRC)) {
  fs.copyFileSync(MANIFEST_SRC, MANIFEST_DEST);
  console.log("✓ Copied manifest.json");
} else {
  console.warn("Warning: manifest.json not found in public directory");
}

// Copy favicon if it exists
const faviconSrc = path.join(PUBLIC_DIR, "favicon.ico");
const faviconDest = path.join(OUT_DIR, "favicon.ico");
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, faviconDest);
  console.log("✓ Copied favicon.ico");
}

// Ensure assets directory structure is preserved
const assetsSrc = path.join(PUBLIC_DIR, "assets");
const assetsDest = path.join(OUT_DIR, "assets");
if (fs.existsSync(assetsSrc)) {
  // Assets should already be copied by Next.js, but verify
  if (!fs.existsSync(assetsDest)) {
    console.warn("Warning: assets directory not found in out directory");
  } else {
    console.log("✓ Assets directory verified");
  }
}

console.log("\n✓ Chrome extension build prepared successfully!");
console.log(`\nExtension files are in: ${OUT_DIR}`);
console.log("\nTo load the extension in Chrome:");
console.log("1. Open Chrome and navigate to chrome://extensions/");
console.log("2. Enable 'Developer mode'");
console.log("3. Click 'Load unpacked'");
console.log(`4. Select the 'out' directory: ${OUT_DIR}`);
