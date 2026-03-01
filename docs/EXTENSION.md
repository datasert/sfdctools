# Chrome Extension Build Guide

This app can be built and packaged as a Chrome extension.

## Building for Chrome Extension

1. **Build the extension:**
   ```bash
   yarn build:extension
   ```
   
   This will:
   - Generate icon data
   - Build the Next.js static export
   - Copy manifest.json and other extension files to the `out` directory

2. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `out` directory from this project

## Extension Structure

The built extension will be in the `out/` directory with:
- `manifest.json` - Extension manifest
- `index.html` - Main app entry point
- `_next/` - Next.js static assets
- `assets/` - Public assets (icons, etc.)
- All other static files

## Development

For regular web development:
```bash
yarn dev
```

For extension development, you can:
1. Build the extension: `yarn build:extension`
2. Load it in Chrome
3. Make changes and rebuild
4. Reload the extension in Chrome (click the reload icon)

## Manifest Configuration

The extension uses Manifest V3 and includes:
- Popup action (opens the app in a popup)
- Options page (same as popup)
- Storage permission for theme preferences

## Notes

- The app uses static export, so all routes are pre-rendered
- Assets are served from the extension's local filesystem
- Theme preferences are stored in Chrome's storage API
- All routing works within the extension context

## Chrome Extension CSP Compliance

This app is configured to comply with Chrome extension Content Security Policy (CSP) requirements:

### ✅ No Dynamic Code Loading
- **Fonts**: Uses system fonts instead of Google Fonts to avoid dynamic font loading
- **Monaco Editor**: Configured to disable workers (no dynamic worker loading)
- **Next.js**: Configured to bundle all code statically (no dynamic imports)

### ✅ CSP Configuration
The manifest.json includes strict CSP:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; worker-src 'none'"
}
```

This ensures:
- Only scripts from the extension itself can run (`'self'`)
- No workers are allowed (`worker-src 'none'`)
- No external code can be loaded dynamically

### Monaco Editor Configuration
Monaco Editor is configured to work without workers:
- Workers are disabled (not needed for basic text editing)
- Auto-completion and suggestions are disabled
- All features requiring workers are turned off

This ensures the editor works perfectly while complying with Chrome extension CSP requirements.
