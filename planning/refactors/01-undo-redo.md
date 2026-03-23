# Plan: Undo / Redo

## Problem

There is no undo. A misplaced drag, an accidental delete, or a wrong keyframe value is permanent. This is a critical trust issue for any editor.

There is a `src/utils/history.ts` file already in the repo — it's stubbed but signals intent. We build on it.

---

## Approach: Immutable State Snapshots

The entire animation state lives in the `scenes` array in `App.tsx`. Because it's already a single serialisable object, the simplest correct approach is to snapshot it.

**Do not use a library yet.** A 30-line custom hook is sufficient and keeps the bundle lean.

### Data structure

```ts
// src/hooks/useHistory.ts
interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}
```

Limit the stack to **50 snapshots**. Each snapshot is a full deep-clone of `AnimationScene[]`. For a typical project (a few layers, modest keyframes) this is ~10–50 KB per snapshot — negligible.

### Hook API

```ts
const {
  state,           // current scenes array
  set,             // replace state and push to history
  undo,
  redo,
  canUndo,
  canRedo,
  clear,           // wipe history on project load
} = useHistory<AnimationScene[]>(initialScenes);
```

`set` is called instead of `setScenes` anywhere a meaningful, user-visible change happens. Small rapid changes (e.g. dragging a layer) should **batch**: only push to history on `pointerup` / `blur`, not on every pixel moved.

### Implementation sketch

```ts
export function useHistory<T>(initial: T) {
  const [stack, setStack] = useState<HistoryStack<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((next: T) => {
    setStack(s => ({
      past: [...s.past.slice(-49), s.present],
      present: next,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setStack(s => {
      if (s.past.length === 0) return s;
      const [present, ...past] = [...s.past].reverse();
      return {
        past: past.reverse(),
        present,
        future: [s.present, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setStack(s => {
      if (s.future.length === 0) return s;
      const [present, ...future] = s.future;
      return {
        past: [...s.past, s.present],
        present,
        future,
      };
    });
  }, []);

  return {
    state: stack.present,
    set,
    undo,
    redo,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
    clear: () => setStack({ past: [], present: stack.present, future: [] }),
  };
}
```

---

## Integration Points

### App.tsx

Replace `const [scenes, setScenes]` with `const { state: scenes, set: setScenes, undo, redo, canUndo, canRedo, clear } = useHistory(initialScenes)`.

This is a near drop-in replacement — every call to `setScenes(...)` automatically becomes an undoable action.

**Exception — don't snapshot these:**
- `isPlaying` state changes
- `currentFrame` changes (scrubbing would flood the stack)
- Scene tab selection (`activeSceneId`)

These are UI state, not document state. They stay as plain `useState`.

### Batching drag operations

In `CanvasArea.tsx`, the Konva `onDragEnd` and `onTransformEnd` handlers already fire once on release. These are where `setScenes` (now `set`) should be called — which is already the pattern. No change needed for drag; the problem only exists if someone calls `set` on every `onDragMove` tick. Audit and fix any such calls.

### Keyboard shortcut

Add to `useKeyboardShortcuts.ts`:
```ts
if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { undo(); e.preventDefault(); }
if ((e.key === 'y' && (e.metaKey || e.ctrlKey)) || (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey)) { redo(); e.preventDefault(); }
```

### Top bar UI

Add `<UndoIcon>` and `<RedoIcon>` buttons to `TopBar.tsx`. Disable when `!canUndo` / `!canRedo`.

### Project load

Call `clear()` after `setScenes(loadedScenes)` so loading a project wipes the undo stack for that project.

---

## What counts as an undoable action

| Action | Undoable? |
|--------|-----------|
| Move / resize layer | Yes (on pointerup) |
| Add layer | Yes |
| Delete layer | Yes |
| Change layer property (color, text content, fill) | Yes (on blur/commit) |
| Add / delete / move keyframe | Yes |
| Add / delete scene | Yes |
| Rename layer or scene | Yes (on blur) |
| Play / pause / scrub | No |
| Panel tab switch | No |
| Project load | Clears stack |

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/hooks/useHistory.ts` | New — implement the hook |
| `src/App.tsx` | Replace `useState` for scenes with `useHistory` |
| `src/hooks/useKeyboardShortcuts.ts` | Add `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z` |
| `src/components/TopBar.tsx` | Add undo/redo buttons |
| `src/utils/history.ts` | Remove (now replaced by the hook) |
