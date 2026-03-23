# Plan: Keyboard Shortcuts, Help & Project Status

Three small but high-leverage UX improvements that help users understand and trust the tool.

---

## 1. Keyboard Shortcut Help Overlay

### Problem

Shortcuts are the fastest path to productivity, but there's zero discoverability. Users must either find them by accident, read the source code, or never know they exist. A simple `?` key overlay costs almost nothing to build.

### Implementation

A full-screen modal, `KeyboardShortcutsHelp.tsx`. Triggered by `?` (question mark) key, or a `?` icon button in the TopBar.

**No state needed in App.tsx** — local state in the component:

```tsx
export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) setOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
        <ShortcutsTable />
      </DialogContent>
    </Dialog>
  );
}
```

**Shortcuts table data** (single source of truth — also used to document what's implemented):

```ts
const SHORTCUT_SECTIONS = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['Shift', 'Ctrl', '←'], description: 'Previous frame' },
      { keys: ['Shift', 'Ctrl', '→'], description: 'Next frame' },
      { keys: ['Ctrl', 'Alt', '←'], description: 'Go to start' },
      { keys: ['Ctrl', 'Alt', '→'], description: 'Go to end' },
    ]
  },
  {
    title: 'Layers',
    shortcuts: [
      { keys: ['V'], description: 'Toggle visibility of selected layer' },
      { keys: ['L'], description: 'Toggle loop on selected layer/group' },
      { keys: ['A'], description: 'Add keyframe at current frame' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate layer' },
      { keys: ['Ctrl', 'C'], description: 'Copy layer' },
      { keys: ['Ctrl', 'V'], description: 'Paste layer' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Paste to all scenes' },
      { keys: ['Delete'], description: 'Delete selected keyframe' },
    ]
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'S'], description: 'Save project' },
    ]
  },
  {
    title: 'Canvas',
    shortcuts: [
      { keys: ['Ctrl', '0'], description: 'Fit canvas to window' },
      { keys: ['Ctrl', '1'], description: 'Reset zoom to 100%' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', 'G'], description: 'Toggle grid' },
      { keys: ['?'], description: 'Show this help' },
    ]
  },
];
```

Each key rendered as a `<kbd>` element with a styled pill appearance.

---

## 2. Expand Keyboard Shortcuts

The existing `useKeyboardShortcuts.ts` has a TODO: "Add other shortcuts (Save, Load, Add Layer, etc.)"

### Add immediately:

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save project |
| `Ctrl+Z` | Undo (from plan 01) |
| `Ctrl+Shift+Z` | Redo (from plan 01) |
| `Ctrl+D` | Duplicate selected layer (from plan 02) |
| `Ctrl+C` | Copy selected layer (from plan 02) |
| `Ctrl+V` | Paste layer (from plan 02) |
| `Ctrl+0` | Fit canvas to window (from plan 04) |
| `Ctrl+1` | Canvas 100% zoom (from plan 04) |
| `Ctrl+G` | Toggle grid (from plan 04) |
| `?` | Open shortcut help (this plan) |

### Refactor the shortcut hook

The current hook takes a large bag of callback props and has repeated if/else chains. Replace with a declarative map:

```ts
type ShortcutDef = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  preventDefault?: boolean;
};

export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // skip when typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as Element)?.tagName)) return;

      for (const def of shortcuts) {
        const matches =
          e.key.toLowerCase() === def.key.toLowerCase() &&
          !!e.metaKey === !!def.meta &&
          !!e.ctrlKey === !!def.ctrl &&
          !!e.shiftKey === !!def.shift &&
          !!e.altKey === !!def.alt;

        if (matches) {
          if (def.preventDefault !== false) e.preventDefault();
          def.action();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
```

This makes it trivial to add new shortcuts and to derive the help overlay content from the same data source.

---

## 3. Auto-save Indicator & Project Status

### Problem

Users save manually, but there's no visual feedback that:
- The project has been saved to Supabase
- The current scene has unsaved changes
- A save is in progress

The `hasUnsavedChanges` flag already exists on `AnimationScene`. It's just not surfaced anywhere.

### What to show

**In SceneTabs:** A small dot indicator on each tab:
- Grey dot: saved
- Orange dot: unsaved changes
- Spinning indicator: save in progress

```tsx
<div className="relative">
  <span>{scene.name}</span>
  {scene.hasUnsavedChanges && (
    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400" />
  )}
</div>
```

**In TopBar:** A subtle status line next to the save button:
```
[💾 Save]   Last saved 3 min ago  ← or →  Unsaved changes
```

Implement with a `lastSavedAt: Date | null` state in `App.tsx`, updated after each successful Supabase save.

```tsx
function formatSaveStatus(lastSaved: Date | null, hasChanges: boolean): string {
  if (hasChanges) return 'Unsaved changes';
  if (!lastSaved) return 'Not saved';
  const mins = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
  if (mins < 1) return 'Saved just now';
  return `Saved ${mins}m ago`;
}
```

### Ctrl+S wiring

`Ctrl+S` should call the existing `saveProject` function from `useProjectManagement`. This is a one-line addition to `useKeyboardShortcuts`, but it needs the save function passed in. Include it in the shortcut map defined above.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/KeyboardShortcutsHelp.tsx` | New — overlay component |
| `src/hooks/useKeyboardShortcuts.ts` | Refactor to declarative map, add new shortcuts |
| `src/components/TopBar.tsx` | Add `?` button, add save status display |
| `src/components/SceneTabs.tsx` | Add unsaved-changes dot indicator |
| `src/App.tsx` | Add `lastSavedAt` state, pass it down |
