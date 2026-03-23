# Plan: Canvas Tools — Zoom, Snap, Alignment

The canvas area is currently static-scale. No zoom, no guides, no alignment tools. For display ads where 1px can matter, this is a significant gap.

---

## 1. Canvas Zoom

### Why it matters

A 320×50 leaderboard is tiny on screen. Editing it at 1:1 is nearly impossible. A 300×600 half-page ad has enough space that zooming in to align elements precisely is essential.

### Implementation

**State:** Add `canvasZoom: number` (default `1.0`) to either `App.tsx` UI state or a new `useCanvasControls` hook. Do not store per-scene — zoom is a viewport concern, not a document property.

**Controls:**
- `Ctrl+scroll` — zoom in/out centred on cursor
- `Ctrl+0` — fit to window (auto-calculate scale to fit canvas in available space)
- `Ctrl+1` — reset to 100%
- `Ctrl++` / `Ctrl+-` — zoom steps (+/-25%)
- Zoom display in status bar (e.g. "75%")

**Canvas rendering:**

`CanvasArea.tsx` wraps the Konva `Stage` in a scrollable container. Apply zoom via Konva's `scaleX`/`scaleY` on the Stage:

```tsx
<Stage
  width={stageSize.width * zoom}
  height={stageSize.height * zoom}
  scaleX={zoom}
  scaleY={zoom}
  ref={stageRef}
>
```

All pointer coordinates from Konva are already in stage-space, so layer positions stay accurate. The surrounding scroll container handles overflow.

**Fit-to-window calculation:**

```ts
function calculateFitZoom(stageSize: StageSize, containerSize: { w: number; h: number }): number {
  const padding = 80; // px
  const scaleX = (containerSize.w - padding) / stageSize.width;
  const scaleY = (containerSize.h - padding) / stageSize.height;
  return Math.min(scaleX, scaleY, 2); // cap at 200%
}
```

Call this on scene switch and on `Ctrl+0`.

**Zoom controls UI:**

A small floating pill in the bottom-left of the canvas area:

```
[ - ]  [ 75% ▾ ]  [ + ]  [ Fit ]
```

The `75%` is a `<Select>` with preset steps: 25%, 50%, 75%, 100%, 150%, 200%.

---

## 2. Snap to Grid

### Implementation

Grid snap is purely a "modifier on drag end" — it rounds the final position to the nearest grid multiple.

```ts
const GRID_SIZE = 8; // default, user-configurable in Stage tab

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
```

Apply in `CanvasArea.tsx` `onDragEnd` handler:

```ts
onDragEnd={e => {
  const node = e.target;
  if (snapEnabled) {
    node.x(snapToGrid(node.x(), gridSize));
    node.y(snapToGrid(node.y(), gridSize));
  }
  // existing update call
  updateLayerPosition(layer.id, node.x(), node.y());
}}
```

**Toggle:** A grid icon button in the canvas toolbar (or `Ctrl+G`). Store `snapEnabled: boolean` in UI state.

**Visual grid overlay:**

Draw a subtle grid on the Konva canvas using a `Layer` behind all content layers:

```tsx
{showGrid && (
  <Layer listening={false}>
    {/* vertical lines */}
    {Array.from({ length: Math.ceil(stageSize.width / gridSize) }, (_, i) => (
      <Line key={`v${i}`} points={[i * gridSize, 0, i * gridSize, stageSize.height]}
        stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    ))}
    {/* horizontal lines */}
    {Array.from({ length: Math.ceil(stageSize.height / gridSize) }, (_, i) => (
      <Line key={`h${i}`} points={[0, i * gridSize, stageSize.width, i * gridSize]}
        stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
    ))}
  </Layer>
)}
```

---

## 3. Smart Guides (Snap to Other Layers)

**Note:** There's a `src/utils/smartGuides.ts` file already in the repo. Build on it.

When dragging a layer, show red guide lines when the dragged layer's edges or centre align with another layer's edges or centre.

### Guide detection

While dragging (`onDragMove`), for each static layer compute:
- Left edge (x), right edge (x+w), horizontal centre (x+w/2)
- Top edge (y), bottom edge (y+h), vertical centre (y+h/2)

If the dragged layer's corresponding edge is within a threshold (e.g. 5px / zoom), snap to it and draw the guide.

### Rendering

Draw guides as a separate Konva `Layer` at the top (above all content), cleared each frame:

```tsx
<Layer ref={guideLayerRef} listening={false}>
  {activeGuides.map((g, i) =>
    g.orientation === 'h'
      ? <Line key={i} points={[0, g.position, stageSize.width, g.position]} stroke="#ff4444" strokeWidth={1} />
      : <Line key={i} points={[g.position, 0, g.position, stageSize.height]} stroke="#ff4444" strokeWidth={1} />
  )}
</Layer>
```

### Performance

Only compute guides when `isDragging` is true. Use `useMemo` keyed on the non-dragging layers. Clear on `onDragEnd`.

---

## 4. Alignment Toolbar

When a layer is selected, show an alignment bar in the properties panel (or floating above the canvas). Aligns the selected layer relative to the canvas bounds:

| Button | Action |
|--------|--------|
| Align Left | `layer.x = 0` |
| Align Centre H | `layer.x = (stageWidth - layer.width) / 2` |
| Align Right | `layer.x = stageWidth - layer.width` |
| Align Top | `layer.y = 0` |
| Align Middle V | `layer.y = (stageHeight - layer.height) / 2` |
| Align Bottom | `layer.y = stageHeight - layer.height` |

This lives in `PropertiesPanel.tsx` as a row of icon buttons, visible when any layer is selected. Six `<Button size="icon">` using lucide icons (`AlignLeft`, `AlignCenterHorizontal`, `AlignRight`, `AlignStartVertical`, `AlignCenterVertical`, `AlignEndVertical`).

Each is a one-liner call to `onUpdateLayerProperty`.

---

## 5. Ruler / Coordinates Display

A simple coordinate readout in the canvas status bar showing the cursor position in stage pixels. Helps with precise placement without needing to check/edit the X/Y inputs.

```
Position: 142, 88    |    Layer: x:120 y:80 w:200 h:40
```

Implemented by listening to Konva Stage `onMouseMove`, storing `{x, y}` in local state (no need for scene state), displaying in a fixed-position overlay at the bottom of the canvas.

---

## Canvas Toolbar Layout

A thin toolbar across the top of the canvas area:

```
[ Grid: ⬜ off / 🟦 on ]  [ Snap: off / on ]  [ Guides: off / on ]  |  [ - ] [ 100% ] [ + ] [ Fit ]
```

All stored in a single `useCanvasPreferences` hook that keeps these UI toggles:
```ts
{
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  smartGuides: boolean;
}
```

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/hooks/useCanvasControls.ts` | New — zoom state + keyboard handlers |
| `src/components/CanvasArea.tsx` | Apply zoom to Stage, add grid layer, guide layer, drag snapping |
| `src/components/CanvasToolbar.tsx` | New — zoom controls + grid/snap toggles |
| `src/utils/smartGuides.ts` | Implement guide detection (file already exists, stubbed) |
| `src/components/PropertiesPanel.tsx` | Add alignment toolbar when layer selected |
