# Plan: App.tsx Decomposition

## Problem

`App.tsx` is ~81KB and contains:
- All scene/layer/animation state
- All event handlers for every operation
- Auth state and Supabase session management
- Export orchestration
- SVG import orchestration
- All inter-component callbacks

This makes every new feature harder to build and every bug harder to find. More importantly, it means **any state change anywhere re-renders everything** — which is why performance fixes have been needed.

This plan breaks it into focused domains. Do this before adding any major new features (undo/redo, asset management) because those will make the God component even harder to manage.

---

## Decomposition Strategy

The key insight: `App.tsx` is doing **three separate jobs**:

1. **Document state** — the scenes array, what's selected, what frame we're on
2. **Auth/project persistence** — Supabase session, save/load, export
3. **UI orchestration** — which dialogs are open, what tab is active, toast/error state

Split these into separate hooks. `App.tsx` becomes a thin shell that wires them together.

---

## Target Structure

```
src/
  hooks/
    useSceneState.ts          ← document state (scenes, selections, mutations)
    useProjectManagement.ts   ← already exists, expand it
    useTimelineControls.ts    ← already exists
    useKeyboardShortcuts.ts   ← already exists
    useHistory.ts             ← from plan 01
    useCanvasControls.ts      ← from plan 04
  contexts/
    SceneContext.tsx           ← provide scene state to deep components
    ProjectContext.tsx         ← provide project/auth state
```

`App.tsx` becomes:
```tsx
export default function App() {
  const history = useHistory(initialScenes);
  const project = useProjectManagement(history);
  const timeline = useTimelineControls(...);
  const canvas = useCanvasControls(...);

  return (
    <SceneContext.Provider value={...}>
      <ProjectContext.Provider value={...}>
        <AppShell />
      </ProjectContext.Provider>
    </SceneContext.Provider>
  );
}
```

---

## `useSceneState` hook

Owns all mutations to the scenes array. Returns the current state and typed mutation functions. Takes the `set` function from `useHistory` so all mutations are automatically undoable.

```ts
function useSceneState(set: HistorySet<AnimationScene[]>, initialScenes: AnimationScene[]) {
  // All the setScenes(...) calls from App.tsx, extracted here
  return {
    scenes: ...,
    activeScene: ...,
    addLayer: (type: LayerType) => ...,
    deleteLayer: (layerId: string) => ...,
    updateLayerProperty: (layerId, property, value) => ...,
    duplicateLayer: (layerId) => ...,
    reorderLayers: (fromIndex, toIndex) => ...,
    addScene: (template?: string) => ...,
    deleteScene: (sceneId: string) => ...,
    addKeyframe: (layerId, frame) => ...,
    deleteKeyframe: (layerId, index) => ...,
    updateKeyframe: (layerId, index, updates) => ...,
    // ... etc
  };
}
```

The benefit: every mutation is in one file, testable in isolation.

---

## `SceneContext`

The deepest components (`TimelineSection`, `CanvasArea`, `PropertiesPanel`) currently receive 20+ props. Replace with context:

```ts
interface SceneContextValue {
  activeScene: AnimationScene;
  activeSceneId: string;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  // mutations from useSceneState
  updateLayerProperty: UpdateLayerPropertyFn;
  addKeyframe: AddKeyframeFn;
  // etc.
}

export const SceneContext = createContext<SceneContextValue>(null!);
export const useScene = () => useContext(SceneContext);
```

Components opt in with `const { activeScene, updateLayerProperty } = useScene()`. This eliminates most of the prop-drilling and makes it straightforward to read current state from deep inside the component tree.

**Important:** Don't make the context too coarse. Split into at least:
- `SceneContext` — document state (changes with every edit)
- `SelectionContext` — what's selected (changes on click)
- `PlaybackContext` — currentFrame, isPlaying (changes every frame!)

If playback state is in the same context as layer data, every frame tick re-renders the entire component tree. Keep them separate.

---

## Performance: playback isolation

**Critical issue:** The current animation loop updates `currentFrame` (stored in scene state) on every frame at 60fps. This triggers `useMemo` recalculations across the entire tree.

**Fix:** Move `currentFrame` and `isPlaying` out of scene state and into a separate `useRef`-backed animation loop that uses direct DOM/canvas manipulation during playback, only syncing to React state when the user pauses.

```ts
// In useTimelineControls
const frameRef = useRef(0);      // fast, no re-renders
const isPlayingRef = useRef(false);

// The raf loop writes to frameRef and updates Konva directly
// via stageRef.current?.getLayers()[0].batchDraw()
// React state only updated on pause/stop for display purposes
```

This is the right architectural fix for the "single animation timeline" performance problem mentioned in recent commits.

---

## Migration approach

**Don't do a big-bang rewrite.** Extract one hook at a time:

1. First: extract `useSceneState` — this is the most impactful and isolated
2. Then: add `SceneContext` to eliminate prop drilling in `TimelineSection`
3. Then: isolate `PlaybackContext` for performance
4. Finally: `ProjectContext` for auth/save/load

Each step is independently shippable and testable.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/hooks/useSceneState.ts` | New — all scene mutation logic |
| `src/contexts/SceneContext.tsx` | New — context + provider |
| `src/contexts/PlaybackContext.tsx` | New — currentFrame + isPlaying isolated |
| `src/App.tsx` | Progressively thin out as hooks/context take over |
| `src/components/TimelineSection.tsx` | Consume `useScene()` instead of 20+ props |
| `src/components/CanvasArea.tsx` | Consume `useScene()` |
| `src/components/PropertiesPanel.tsx` | Consume `useScene()` |
