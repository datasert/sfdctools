import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "fs";
import { join } from "path";

// One-time script to move assets from root/assets to public/assets
function moveAssets() {
  const sourceDir = join(process.cwd(), "assets");
  const destDir = join(process.cwd(), "public", "assets");
  
  if (!existsSync(sourceDir)) {
    console.warn(`Assets directory not found: ${sourceDir}`);
    console.log("Icons should already be in public/assets/sldsv1-icons");
    return;
  }

  if (existsSync(destDir)) {
    console.log(`Destination already exists: ${destDir}`);
    console.log("Skipping move. If you want to overwrite, delete public/assets first.");
    return;
  }

  function copyRecursive(src: string, dest: string) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    
    const entries = readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }
  
  console.log(`Moving assets from ${sourceDir} to ${destDir}...`);
  copyRecursive(sourceDir, destDir);
  console.log("Assets moved successfully!");
  console.log(`You can now delete the ${sourceDir} directory if you want.`);
}

moveAssets();
