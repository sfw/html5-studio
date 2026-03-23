# Plan: Template System Overhaul

The template selector is the first thing a new user sees. Currently preview images fail to load (404), the sizes are hard to evaluate without context, and there's no path for a user to define their own templates.

---

## 1. Fix Preview Images — CSS-drawn Aspect Ratio Cards

**Problem:** The code tries to load `/previews/*.png` but the image assets don't exist. The fallback is a grey box.

**Solution:** Replace image-based previews with CSS-drawn aspect-ratio cards. No image files needed. Each card shows the ad dimensions visually at a consistent maximum size, with a label showing the name and pixel dimensions.

```tsx
function TemplatePreviewCard({ template }: { template: AdTemplate }) {
  const maxW = 140, maxH = 100;
  const aspectRatio = template.width / template.height;

  let w, h;
  if (aspectRatio > maxW / maxH) {
    w = maxW; h = Math.round(maxW / aspectRatio);
  } else {
    h = maxH; w = Math.round(maxH * aspectRatio);
  }

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:border-primary cursor-pointer">
      <div
        className="bg-muted border border-border/50 flex items-center justify-center text-xs text-muted-foreground"
        style={{ width: w, height: h }}
      >
        {template.width}×{template.height}
      </div>
      <span className="text-sm font-medium">{template.name}</span>
      <span className="text-xs text-muted-foreground">{template.width} × {template.height}</span>
    </div>
  );
}
```

This completely removes the need for preview image files and gives a much more useful "what does this aspect ratio look like" preview than any screenshot would.

---

## 2. Custom Dimension Input

**Problem:** If a user needs a non-standard size (e.g. 640×480 for an interstitial, or a bespoke format), they must use the default template and manually change stage dimensions afterwards.

**Addition:** A "Custom Size" option at the bottom of the template selector:

```
┌─────────────────────────────────┐
│  Width: [   300 ] px            │
│  Height: [  250 ] px            │
│  Name: [ Custom 300×250      ]  │
│                                 │
│  [  Create Custom Scene  ]      │
└─────────────────────────────────┘
```

This creates a blank scene with the specified stage size — no layers, no animations. The scene name defaults to `"Custom {W}×{H}"` but is editable inline.

---

## 3. Better Template Organisation

**Current:** Three categories (Banners, Skyscrapers, Mobile, Other) with no context.

**Improved structure:**

| Category | Templates | Description shown |
|----------|-----------|-------------------|
| Display | 728×90, 300×250, 336×280, 468×60 | Common web banner placements |
| Rich Media | 970×90, 970×250 | Larger format interactive |
| Half Page / Skyscraper | 300×600, 160×600, 120×600, 300×1050 | Sidebar placements |
| Mobile | 320×50, 320×100, 320×480, 480×800 | Phone and tablet |
| Custom | — | Enter any dimensions |

Each category should have a one-line description of where these sizes appear. Context helps users who don't know IAB sizes by heart.

---

## 4. "Save as Template" Feature

**Goal:** A user builds a nicely-styled 300×250 with their brand colours. They should be able to save it as a starting point for future work.

**Implementation:**

In the Stage properties tab, add a "Save as Template" button. This:
1. Serialises the current scene's layers + stageSize to JSON
2. Saves to `localStorage` under `snsanimate_custom_templates`
3. Adds a "My Templates" tab to the template selector showing saved templates

The custom templates appear in a new `My Templates` tab. Each can be deleted (with confirmation). No server-side storage needed for v1.

```ts
interface CustomTemplate {
  id: string;
  name: string;
  createdAt: string;
  stageSize: StageSize;
  layers: LayerData[];
  animations: AnimationData[];
}

function saveCustomTemplate(scene: AnimationScene, name: string): void {
  const existing = loadCustomTemplates();
  const template: CustomTemplate = {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    stageSize: scene.stageSize,
    layers: scene.layers,
    animations: scene.animations,
  };
  localStorage.setItem('snsanimate_custom_templates', JSON.stringify([...existing, template]));
}
```

---

## 5. Template Content Improvements

The built-in template JSON files are minimal (grey background + placeholder text). For a tool demoing to clients or used for pitches, better starter content helps.

For each template, consider adding:
- A gradient background (using the existing gradient layer type) instead of flat grey
- A placeholder for a logo/image layer (400×100 at top, type: `image`, no src)
- CTA button rectangle (a colour layer with rounded look)
- Headline text + sub-copy text (with proper sizing for the format)
- Proper animation: stagger the elements in 0.1s apart with `power2.out`, not all starting at frame 0

This is content/data work, not code work. Update the 16 JSON files in `/src/templates/`.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/TemplateSelectorDialog.tsx` | Replace img-based previews with CSS aspect-ratio cards, add custom dimension input, new category layout |
| `src/utils/templateUtils.ts` | New — `saveCustomTemplate`, `loadCustomTemplates`, `deleteCustomTemplate` |
| `src/components/properties/StageProperties.tsx` | Add "Save as Template" button |
| `src/templates/*.json` | Update with richer starter content |
