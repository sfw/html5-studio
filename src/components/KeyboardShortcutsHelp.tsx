import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShortcutDef {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutDef[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['Shift', 'Ctrl', '←'], description: 'Previous frame' },
      { keys: ['Shift', 'Ctrl', '→'], description: 'Next frame' },
      { keys: ['Ctrl', 'Alt', '←'], description: 'Go to start' },
      { keys: ['Ctrl', 'Alt', '→'], description: 'Go to end' },
    ],
  },
  {
    title: 'Layers',
    shortcuts: [
      { keys: ['V'], description: 'Toggle visibility of selected layer' },
      { keys: ['L'], description: 'Toggle loop on selected layer / group' },
      { keys: ['A'], description: 'Add keyframe at pending marker' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected layer' },
      { keys: ['Delete'], description: 'Delete selected layer' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'S'], description: 'Save project' },
    ],
  },
  {
    title: 'App',
    shortcuts: [
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground leading-none">
      {children}
    </kbd>
  );
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
          {SHORTCUT_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className="text-muted-foreground mx-0.5 text-xs">+</span>}
                          <Kbd>{key}</Kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/** Self-contained trigger button for the TopBar */
export function ShortcutsHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} title="Keyboard shortcuts (?)">
      <Keyboard className="h-4 w-4" />
    </Button>
  );
}
