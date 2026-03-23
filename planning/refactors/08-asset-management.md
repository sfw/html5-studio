# Plan: Asset Library Panel

## Problem

Images are uploaded per-layer and per-scene. If you use the same logo on 6 ad sizes, you upload it 6 times — and each scene stores a separate Supabase URL. There's no central place to manage project images.

This is a meaningful workflow improvement for any real ad production job.

---

## Concept: Project Asset Shelf

A collapsible panel (or a tab in the existing left sidebar area) showing all images associated with the current project. Assets are uploaded once and referenced by URL across scenes and layers.

---

## Storage

Assets already go to Supabase Storage via `useProjectManagement.ts`. The change is to track them at the project level, not the layer level.

Add an `assets` field to the project data stored in Supabase:

```ts
interface ProjectAsset {
  id: string;
  name: string;           // filename
  url: string;            // Supabase storage URL
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  thumbnailUrl?: string;  // same URL for images, can be lazy-generated
}

interface ProjectData {
  scenes: AnimationScene[];
  assets: ProjectAsset[];   // NEW
}
```

When a user uploads an image to a layer, it also registers in `assets`. When loading a project, `assets` is restored and displayed in the shelf.

---

## UI: Asset Panel

A tab in the properties panel sidebar, or a dedicated sliding drawer on the left:

```
┌─────────────────────────────┐
│ 📁 Assets          [+ Add]  │
├─────────────────────────────┤
│ [img] logo.png    120 KB    │
│ [img] hero.jpg    245 KB    │
│ [img] bg.png       88 KB   │
├─────────────────────────────┤
│ 3 files · 453 KB total      │
└─────────────────────────────┘
```

Each asset row:
- Thumbnail (small, 32×32 `object-fit: cover`)
- Filename
- File size
- On hover: "Use in layer" button, delete button

**"Use in layer"** — clicking assigns the asset URL to the currently selected image layer's `src`. If no image layer is selected, it creates a new image layer using the asset's natural dimensions.

**Drag to canvas** — dragging an asset from the shelf onto the Konva canvas creates a new image layer at the drop position with the correct dimensions. This is the most fluid UX but is Tier 3 complexity.

---

## Upload Flow Change

**Current flow:**
1. Select image layer
2. Click "Upload" in ImageLayerProperties
3. File picker opens → uploads to Supabase → sets `layer.src`

**New flow:**
1. Upload from the Asset panel (top-level) → registers in project assets
2. Open image layer properties → "Select from Assets" button opens an asset picker
3. Asset picker shows all project assets as thumbnails
4. Click one → sets `layer.src` to the asset URL

The old direct-upload-to-layer flow should remain as a shortcut ("Upload new...") at the bottom of the picker.

---

## Asset Picker Component

A compact popover or dialog used inside `ImageLayerProperties`:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <ImageIcon className="w-4 h-4 mr-2" />
      Select Image
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-72 p-2">
    <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
      {projectAssets.map(asset => (
        <button
          key={asset.id}
          className="aspect-square rounded overflow-hidden border hover:border-primary"
          onClick={() => onSelectAsset(asset.url)}
        >
          <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
        </button>
      ))}
    </div>
    <Separator className="my-2" />
    <Button variant="ghost" size="sm" className="w-full" onClick={onUploadNew}>
      Upload new...
    </Button>
  </PopoverContent>
</Popover>
```

---

## Asset Deletion

When deleting an asset from the shelf:
1. Check if any layer in any scene references this URL
2. If yes, warn: "This image is used in 3 layers. Deleting it will show a broken image placeholder."
3. If confirmed, delete from Supabase Storage and remove from `assets` array

This is the TODO already noted in `App.tsx` ("TODO: Consider deleting associated assets from Supabase Storage?").

---

## Phase 1 scope (minimal viable)

Don't do everything at once. Phase 1:
1. Add `assets` array to project data (stored in Supabase alongside scenes)
2. When an image is uploaded to a layer, also register it in `assets`
3. Show the Asset panel listing (read-only, no drag-to-canvas yet)
4. "Use in layer" button to assign an existing asset to the selected layer

Phase 2:
5. Asset picker popover in ImageLayerProperties
6. Drag from shelf to canvas
7. Asset deletion with reference checking

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `ProjectAsset` type, add `assets` field to `ProjectData` |
| `src/hooks/useProjectManagement.ts` | Save/load `assets` array, register asset on upload |
| `src/components/AssetPanel.tsx` | New — shelf UI |
| `src/components/properties/ImageLayerProperties.tsx` | Replace upload button with asset picker |
| `src/App.tsx` | Add `projectAssets` state, pass to AssetPanel + ImageLayerProperties |
