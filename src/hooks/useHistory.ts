import { useState, useCallback } from 'react';

type Updater<T> = T | ((prev: T) => T);

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater;
}

interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseHistoryReturn<T> {
  state: T;
  /** Push a snapshot to history before updating (use for all content changes). */
  set: (updater: Updater<T>) => void;
  /** Update state silently without touching the history stack (use for UI-only state: currentFrame, isPlaying, hasUnsavedChanges). */
  setQuiet: (updater: Updater<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Wipe the undo/redo stacks (call after loading a project). */
  clear: () => void;
}

const MAX_HISTORY = 50;

export function useHistory<T>(initial: T): UseHistoryReturn<T> {
  const [stack, setStack] = useState<HistoryStack<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((updater: Updater<T>) => {
    setStack(s => {
      const next = resolveUpdater(updater, s.present);
      return {
        past: [...s.past.slice(-(MAX_HISTORY - 1)), s.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const setQuiet = useCallback((updater: Updater<T>) => {
    setStack(s => ({ ...s, present: resolveUpdater(updater, s.present) }));
  }, []);

  const undo = useCallback(() => {
    setStack(s => {
      if (s.past.length === 0) return s;
      const past = [...s.past];
      const present = past.pop()!;
      return { past, present, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setStack(s => {
      if (s.future.length === 0) return s;
      const [present, ...future] = s.future;
      return { past: [...s.past, s.present], present, future };
    });
  }, []);

  const clear = useCallback(() => {
    setStack(s => ({ past: [], present: s.present, future: [] }));
  }, []);

  return {
    state: stack.present,
    set,
    setQuiet,
    undo,
    redo,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
    clear,
  };
}
