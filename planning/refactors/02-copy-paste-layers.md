# Plan: Layer Copy / Paste / Duplicate

## Problem

There's no way to duplicate layers. If you need the same styled text on three scenes, you must rebuild it three times. This is a major workflow bottleneck for ad production where the same brand element (logo, CTA button, disclaimer text) needs to appear across sizes.

---

## Three operations needed

| Operation | Shortcut | Scope |
|-----------|----------|-------|
| **Duplicate** | `Ctrl+D` | Copy + paste within the same scene, offset by +10px |
| **Copy** | `Ctrl+C` | Place in clipboard (in-memory) |
| **Paste** | `Ctrl+V` | Paste into current scene (or cross-scene paste if clipboard has a layer) |
| **Paste to All Scenes** | `Ctrl+Shift+V` | Paste copied layer into every scene — essential for shared brand elements |

---

## Clipboard state

Add to `App.tsx` (not in `useHistory` — clipboard is not undoable):

```ts
const [layerClipboard, setLayerClipboard] = useState<{
  layer: LayerData;
  animation: AnimationData | undefined;
} | null>(null);
```

This is a simple in-memory store. Cross-session clipboard persistence is not needed.

---

## Duplicate logic

```ts
function duplicateLayer(sourceLayerId: string) {
  const newId = uuidv4();
  const source = activeLayers.find(l => l.id === sourceLayerId);
  if (!source) return;

  const newLayer: LayerData = {
    ...deepClone(source),
    id: newId,
    name: `${source.name} copy`,
    x: source.x + 10,
    y: source.y + 10,
  };

  const sourceAnim = activeAnimations.find(a => a.layerId === sourceLayerId);
  const newAnim: AnimationData | undefined = sourceAnim
    ? { ...deepClone(sourceAnim), layerId: newId }
    : undefined;

  setScenes(scenes => updateActiveScene(scenes, activeSceneId, scene => ({
    ...scene,
    layers: [...scene.layers, newLayer],
    animations: newAnim ? [...scene.animations, newAnim] : scene.animations,
  })));

  setSelectedLayerId(newId);
}
```

`deepClone` can be `JSON.parse(JSON.stringify(...))` — these are plain serialisable objects.

---

## Paste to All Scenes

This is the killer feature for ad production. A user designs a disclaimer text layer on the 300×250, then pastes it to the 728×90, the 160×600, etc. in one action.

```ts
function pasteLayerToAllScenes() {
  if (!layerClipboard) return;
  const { layer, animation } = layerClipboard;

  setScenes(scenes => scenes.map(scene => {
    const newId = uuidv4();
    const newLayer = { ...deepClone(layer), id: newId, name: layer.name };
    const newAnim = animation ? { ...deepClone(animation), layerId: newId } : undefined;
    return {
      ...scene,
      layers: [...scene.layers, newLayer],
      animations: newAnim ? [...scene.animations, newAnim] : scene.animations,
    };
  }));
}
```

---

## UI surfaces

1. **Keyboard shortcuts** (primary) — wire `Ctrl+C/V/D` in `useKeyboardShortcuts.ts`
2. **Context menu on layer row** in the timeline — right-click shows: Copy, Duplicate, Delete
3. **Properties panel** — add a "Duplicate" button next to the Delete button
4. **TopBar "Edit" menu** (optional, Tier 3) — a simple dropdown with Edit operations

---

## Layer context menu

A small right-click context menu on timeline layer rows is the right long-term surface. Use Radix `DropdownMenu` (already a dependency) triggered on `contextmenu` event:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <div onContextMenu={e => { e.preventDefault(); /* open */ }}>
      {/* layer row content */}
    </div>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => copyLayer(layer.id)}>Copy</DropdownMenuItem>
    <DropdownMenuItem onClick={() => duplicateLayer(layer.id)}>Duplicate  Ctrl+D</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => pasteLayerToAllScenes()}>Paste to All Scenes</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive" onClick={() => deleteLayer(layer.id)}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `layerClipboard` state, `copyLayer`, `pasteLayer`, `duplicateLayer`, `pasteLayerToAllScenes` functions |
| `src/hooks/useKeyboardShortcuts.ts` | Add `Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `Ctrl+Shift+V` |
| `src/components/TimelineSection.tsx` | Add right-click context menu on layer rows |
| `src/components/PropertiesPanel.tsx` | Add "Duplicate" button |
