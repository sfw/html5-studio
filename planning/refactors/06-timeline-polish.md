# Plan: Timeline Polish

The timeline is the heart of the tool. Several features are close to done but missing the last 20% that makes them feel complete.

---

## 1. Keyframe Copy / Paste

**Problem:** To create a looping animation you often need the first keyframe repeated at the end. Currently you must manually re-enter all values.

**Implementation:**

Store a `keyframeClipboard: Keyframe | null` in local timeline state (not in scene state — it's transient UI).

Right-click a keyframe diamond → context menu:
```
Copy keyframe
Paste keyframe here    (pastes values at current frame)
Duplicate to frame...  (opens small input for target frame)
```

Paste copies all property values from the clipboard keyframe into a new keyframe at the current frame (or at the clicked position), preserving the easing.

---

## 2. Keyframe Multi-select

**Problem:** Can't select multiple keyframes to shift them in time together. Restructuring an animation (e.g. pushing everything 1 second later) requires editing each keyframe individually.

**Design:**

- `Shift+click` a keyframe to add it to a selection set
- Click and drag on empty timeline space to rubber-band select keyframes in a range
- Selected keyframes highlighted with a different colour (e.g. white instead of the layer colour)

**Move selected keyframes:**

- `Ctrl+drag` any selected keyframe — moves all selected by the same delta
- `←` / `→` arrow keys move selected keyframes by 1 frame
- `Shift+←` / `Shift+→` move by 10 frames

**State:**

```ts
const [selectedKeyframes, setSelectedKeyframes] = useState<
  Array<{ layerId: string; index: number }>
>([]);
```

This replaces `editingKeyframe` or runs alongside it. When > 1 keyframe selected, show a summary in the Properties panel ("3 keyframes selected") instead of individual values.

---

## 3. Easing Preview on Keyframe

**Problem:** The easing name is shown in the AnimationPanel, but there's no visual sense of what it looks like. Users have to play the animation to see the effect.

**Design:**

A small SVG curve preview next to the easing name selector in `AnimationPanel.tsx`. 16×16px curve drawn in SVG from a lookup table of control points.

```tsx
function EasingCurvePreview({ easing }: { easing: string }) {
  const points = getEasingPoints(easing, 32); // sample at 32 points
  const d = pointsToSvgPath(points, 16, 16);
  return (
    <svg width="16" height="16" viewBox="0 0 1 1" className="opacity-60">
      <path d={d} stroke="currentColor" strokeWidth="0.08" fill="none" />
    </svg>
  );
}
```

Where `getEasingPoints` evaluates the easing function at 32 evenly-spaced t values (reuse the same `applyEasing` function from the export utils, just import it here).

This is a pure display component — no new state, no side effects.

---

## 4. Timeline Loop Region Visualisation

**Problem:** The `loopStartFrame` and `loopEndFrame` fields exist on `AnimationData` but aren't visualised. The current loop toggle applies to the full animation. For ads with a "hold" phase (animate in → hold → animate in again), there's no way to define which segment loops.

**Design:**

When a layer has `loop: true`, show a semi-transparent coloured band on the timeline spanning the looping region (currently `lastKf.frame` to `totalFrames`). A draggable handle on each end lets users adjust the loop region.

This is a Tier 2/3 feature — the type infrastructure exists, but the animation logic in `animation.ts` would need updating to respect `loopStartFrame`/`loopEndFrame` instead of the implicit last-keyframe-to-total.

---

## 5. Frame Duration Ruler & Time Labels

**Current state:** The timeline ruler shows frame numbers. For people thinking in seconds ("fade in over 0.5s"), this requires mental arithmetic.

**Improvement:** Below the frame numbers, show time markers in seconds. At 60fps, every major tick (every 60 frames) would show "1s", "2s", etc. Minor ticks every 30 frames show "0.5s".

This is a pure rendering change in the timeline ruler drawing code — no state changes.

---

## 6. Playhead Scrubbing Improvement

**Problem:** The playhead (current frame indicator) can be dragged but the drag target is small and precise. On a zoomed-out timeline with many layers, it's hard to hit.

**Improvements:**
- Increase the drag target to a larger triangle/handle at the top of the playhead
- Show a tooltip with current frame + time while dragging (`Frame 120 — 2.0s`)
- Clicking anywhere on the ruler (not just the playhead) should jump to that frame

---

## 7. Layer Row Height

**Problem:** Layer rows in the timeline are a fixed height. When many layers exist, they scroll off screen and are hard to navigate.

**Improvement:** Add a "compact mode" toggle that reduces row height from `h-10` to `h-6`. Store preference in localStorage.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/TimelineSection.tsx` | Keyframe multi-select, copy/paste, loop band, ruler time labels, compact mode |
| `src/components/properties/AnimationPanel.tsx` | Add easing curve preview SVG |
| `src/utils/animation.ts` | Expose easing evaluation for curve preview |
| `src/types/index.ts` | No changes needed (loop region fields already exist) |
