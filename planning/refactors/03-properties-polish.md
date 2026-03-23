# Plan: Properties Panel Polish

Addresses several TODO items already in the codebase, plus missing affordances that block common ad production tasks.

---

## 1. Image Fit UI

**Status:** Type defined (`'contain' | 'cover' | 'fill' | 'none'`), export logic implemented, canvas rendering implemented. **Only the UI is missing.**

**Where:** `src/components/properties/ImageLayerProperties.tsx`

**Implementation:** A 4-button toggle group, not a dropdown. Visual affordance is clearer:

```tsx
const FIT_OPTIONS = [
  { value: 'fill',    label: 'Fill',    icon: <Maximize2 />,     title: 'Stretch to fill' },
  { value: 'contain', label: 'Contain', icon: <Minimize2 />,     title: 'Fit within bounds' },
  { value: 'cover',   label: 'Cover',   icon: <Square />,        title: 'Cover and clip' },
  { value: 'none',    label: 'None',    icon: <ImageIcon />,     title: 'Native size' },
] as const;

<div className="grid grid-cols-4 gap-1">
  {FIT_OPTIONS.map(opt => (
    <Tooltip key={opt.value}>
      <TooltipTrigger asChild>
        <Button
          variant={layer.fit === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onUpdateLayerProperty(layer.id, 'fit', opt.value)}
        >
          {opt.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{opt.title}</TooltipContent>
    </Tooltip>
  ))}
</div>
```

Default to `fill` for new image layers (current behaviour). Persist via the normal `onUpdateLayerProperty` path.

---

## 2. Text Effects UI

**Status:** `TextEffects` type fully defined (shadow + stroke with all properties). The export doesn't yet render effects, but the type is ready.

**Where:** `src/components/properties/TextLayerProperties.tsx`, new collapsible "Effects" section

### Shadow

```
[✓] Drop Shadow
    Color: [picker]    Opacity: [0-100 slider]
    Blur:  [0-50 slider]
    X: [number input]  Y: [number input]
```

Canvas rendering in export:
```js
if (props.effects?.shadow) {
  const s = props.effects.shadow;
  ctx.shadowColor = s.color;
  ctx.shadowBlur = s.blur;
  ctx.shadowOffsetX = s.offsetX;
  ctx.shadowOffsetY = s.offsetY;
  ctx.globalAlpha = (props.opacity ?? 1) * (s.opacity ?? 1);
}
// ... draw text ...
// reset
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
```

### Stroke

```
[✓] Stroke
    Color: [picker]    Width: [1-20 slider]    Opacity: [0-100 slider]
```

Canvas rendering: draw text twice — first with `ctx.strokeText()`, then `ctx.fillText()` on top.

### UI structure

Use a Radix `Accordion` (already a dependency) to keep the effects section collapsible so it doesn't crowd the panel:

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="effects">
    <AccordionTrigger>Effects</AccordionTrigger>
    <AccordionContent>
      <ShadowControls ... />
      <StrokeControls ... />
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## 3. Layer Lock

**Status:** `locked?: boolean` is in `BaseLayerData`. Not surfaced in UI, not respected anywhere.

**Where:** Layer row in `TimelineSection.tsx` + `CanvasArea.tsx` hit-testing

**UI:** Add a lock icon button to each layer row (alongside the visibility eye icon). Clicking it toggles `locked`.

**Behaviour when locked:**
- Skip `draggable` on Konva node: `draggable={!layer.locked}`
- Skip attaching `Transformer` when `locked` layer is selected
- Show lock cursor (`cursor: not-allowed`) on hover
- Still allow selecting the layer to view properties (just not edit canvas position)

This is a 2-file change and a single boolean check. High impact, low effort.

---

## 4. Blend Mode UI

**Status:** `BlendMode` type is comprehensive. Applied in Konva canvas. Not exposed in properties panel.

**Where:** `src/components/PropertiesPanel.tsx` or the individual layer property files

**UI:** A single `<Select>` dropdown. Because blend modes matter most for advanced users, put it in a collapsed "Advanced" accordion at the bottom of the layer tab:

```tsx
<Select value={layer.blendMode ?? 'normal'} onValueChange={v => onUpdate('blendMode', v)}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    {BLEND_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
  </SelectContent>
</Select>
```

Also needs to be applied in the export canvas script. Currently `globalCompositeOperation` is not set in `exportHTML5.ts`.

---

## 5. Layer Opacity — fine control

Currently a slider (0–1). Fine values (e.g. 0.73) are hard to set with a slider alone. Add a companion number input showing 0–100 (percentage):

```tsx
<div className="flex items-center gap-2">
  <Slider value={[layer.opacity * 100]} onValueChange={([v]) => onUpdate('opacity', v / 100)} max={100} />
  <Input
    type="number"
    value={Math.round(layer.opacity * 100)}
    onChange={e => onUpdate('opacity', Number(e.target.value) / 100)}
    className="w-14 text-right"
  />
  <span className="text-xs text-muted-foreground">%</span>
</div>
```

---

## 6. Position / Size — linked proportions

When resizing via the properties panel inputs, there's no way to maintain aspect ratio. Add a chain-link toggle between W and H that locks the ratio:

```
W: [300]  🔗  H: [250]
```

When linked, changing W recalculates H = W / aspectRatio, and vice versa. Store `linkedProportions: boolean` in local component state (not scene state — it's a UI preference).

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/properties/ImageLayerProperties.tsx` | Add fit toggle group |
| `src/components/properties/TextLayerProperties.tsx` | Add effects accordion (shadow, stroke) |
| `src/components/TimelineSection.tsx` | Add lock icon to layer rows |
| `src/utils/exportHTML5.ts` | Add shadow/stroke rendering in generated script, add `globalCompositeOperation` for blend modes |
| `src/components/PropertiesPanel.tsx` | Add blend mode select, opacity % input, linked W/H toggle |
