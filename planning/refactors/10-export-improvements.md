# Plan: Export UX Improvements

The export pipeline is now solid (easing, gradients, fit modes all work). This plan is about the user-facing side: feedback, validation, and preview before download.

---

## 1. Export Progress Modal

**Current:** The export button disables and shows "Exporting..." in-place. For a multi-scene batch export with many images, this can take 10–30 seconds with no feedback.

**Improvement:** A modal that shows a real-time log during export:

```
┌────────────────────────────────────────┐
│ Exporting: "Black Friday Campaign"     │
├────────────────────────────────────────┤
│ ✓  Generating script.js               │
│ ✓  Generating styles.css              │
│ ✓  Generating index.html              │
│ ⟳  Fetching logo.png (scene 1/4)...   │
│    Fetching hero.jpg...               │
│    Fetching bg.png...                 │
│    Processing scene 2/4...            │
├────────────────────────────────────────┤
│ ████████░░░░░░░░░░░░  40%             │
└────────────────────────────────────────┘
```

The `onProgress` and `onWarning` callbacks in `exportHTML5Package` and `generateScenePackageBlob` are already wired. The modal just needs to consume them.

```tsx
interface ExportLogEntry {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

function ExportProgressModal({ isOpen, log, progress }: {
  isOpen: boolean;
  log: ExportLogEntry[];
  progress: number; // 0-100
}) { ... }
```

The `progress` value is calculated from known steps: N scenes × (3 files + M images). Each completed step increments it.

---

## 2. IAB Validation UI

**Current:** A basic size check runs but warnings only appear in the progress callback (text messages in the export log).

**IAB limits by ad type:**

| Spec | Limit |
|------|-------|
| Google Display Network | 150 KB initial load |
| DoubleClick / DV360 | 200 KB initial load |
| Standard IAB | 150 KB |

**Improvement:** After generating the zip but before downloading it, show a validation summary:

```
┌─────────────────────────────────────────┐
│ Export Validation                       │
├────────────────────────┬────────────────┤
│ Scene                  │ Size           │
├────────────────────────┼────────────────┤
│ 300×250                │ ✓  82 KB       │
│ 728×90                 │ ✓  71 KB       │
│ 160×600                │ ⚠  163 KB      │
│ 320×50                 │ ✓  44 KB       │
├────────────────────────┼────────────────┤
│ Total package          │ 360 KB         │
└────────────────────────┴────────────────┘
│  ⚠ 160×600 exceeds 150 KB IAB limit.   │
│    Consider reducing image file sizes.  │
│                                         │
│  [  Download Anyway  ]  [  Cancel  ]    │
└─────────────────────────────────────────┘
```

The size for each scene blob is already computed in `generateScenePackageBlob`. Collect them and display before triggering `saveAs`.

---

## 3. Export Target Selection

Different ad networks have different requirements. Add an "Export for..." dropdown in the export options:

| Target | Max Size | Special Requirements |
|--------|----------|---------------------|
| Google Display Network | 150 KB | `clickTag` variable required |
| DV360 / DoubleClick | 200 KB | `enabler.init()` required |
| Generic HTML5 | None | Standard |

When "DV360" is selected, the generated `index.html` includes the `Enabler` stub:

```html
<script src="https://s0.2mdn.net/ads/studio/Enabler.js"></script>
<script>
  Enabler.setProfileId(0);
  var initialized = false;
  function init() { if (initialized) return; initialized = true; startAd(); }
  if (Enabler.isInitialized()) { init(); } else { Enabler.addEventListener(studio.events.StudioEvent.INIT, init); }
</script>
```

Store the selected target in `ExportConfig` (add `target: 'gdn' | 'dv360' | 'generic'`).

This is a Tier 3 feature but high value for agencies using the tool professionally.

---

## 4. Preview Before Download

A "Preview" button next to "Export" that opens the generated HTML5 ad in a new tab (or a modal iframe) before downloading the zip. This lets the user verify the animation looks correct in the exported version without downloading.

**Implementation:**

Instead of downloading, pass the generated HTML/JS/CSS to a `<blob:>` URL:

```ts
async function previewExport(config: ExportConfig) {
  // Generate the files in memory
  const scriptContent = generateScriptContent(config);
  const cssContent = generateCSSContent();
  // For preview, inline assets as base64 data URLs
  const htmlContent = generatePreviewHTML(config, scriptContent, cssContent);

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Revoke after 5s to avoid memory leak
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
```

For the preview, images are inlined as base64 (since there's no `assets/` folder in the preview context). The HTML template includes the script inline rather than as a separate `script.js` reference.

This gives an accurate pixel-perfect preview of exactly what will be downloaded.

---

## 5. Export Filename Control

**Current:** Always downloads as `ad_package.zip`.

**Improvement:** Let the user name the export in the export dialog. Default to the project name. Show a text input in the export options:

```
Filename: [ Black_Friday_Campaign ] .zip
```

Also offer per-scene naming for batch exports: `{project_name}_{scene_name}_{date}.zip`.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/ExportProgressModal.tsx` | New — progress log + validation summary |
| `src/utils/exportHTML5.ts` | Add `previewHTML` generation (inlined assets), add export target parameter |
| `src/types/index.ts` | Add `target` field to `ExportConfig` |
| `src/App.tsx` | Wire up ExportProgressModal, add preview handler |
| `src/components/TopBar.tsx` | Add preview button, export target selector |
