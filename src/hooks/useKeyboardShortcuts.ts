import { useEffect, useCallback } from 'react';
import { AnimationScene, PendingKeyframeMarker, LayerData } from '@/types'; // Import AnimationScene type, PendingKeyframeMarker, and LayerData

// Define the arguments the hook will accept
interface KeyboardShortcutsProps {
  togglePlay: () => void;
  updateSceneState: (sceneId: string, updates: Partial<Pick<AnimationScene, 'currentFrame' | 'isPlaying'>>) => void;
  activeSceneId: string;
  activeCurrentFrame: number;
  activeTotalFrames: number;
  prevFrameKeyHandlers: { onMouseDown: () => void };
  nextFrameKeyHandlers: { onMouseDown: () => void };
  selectedLayerId: string | null;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLoop: (layerId: string) => void;
  pendingKeyframeMarker: PendingKeyframeMarker;
  handleAddKeyframeAtFrame: (layerId: string, frame: number) => void;
  toggleGroupLoop: (groupId: string) => void;
  layers: LayerData[];
  undo: () => void;
  redo: () => void;
  saveProject: () => void;
  duplicateLayer: (layerId: string) => void;
  copyLayer: (layerId: string) => void;
  pasteLayer: () => void;
  pasteLayerToAllScenes: () => void;
}

// The hook itself
export const useKeyboardShortcuts = ({
  togglePlay,
  updateSceneState,
  activeSceneId,
  activeCurrentFrame,
  activeTotalFrames,
  selectedLayerId,
  toggleLayerVisibility,
  toggleLayerLoop,
  pendingKeyframeMarker,
  handleAddKeyframeAtFrame,
  toggleGroupLoop,
  layers,
  undo,
  redo,
  saveProject,
  duplicateLayer,
  copyLayer,
  pasteLayer,
  pasteLayerToAllScenes,
}: KeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore shortcuts if typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Play/Pause
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    }

    // Frame Stepping (Single Press - repeating handled by mouse down/up)
    // Go to previous frame
    if (event.key === 'ArrowLeft' && event.shiftKey && event.ctrlKey) {
      event.preventDefault();
      const newFrame = Math.max(0, activeCurrentFrame - 1);
      if (newFrame !== activeCurrentFrame) {
        updateSceneState(activeSceneId, { currentFrame: newFrame });
      }
    }
    // Go to next frame
    if (event.key === 'ArrowRight' && event.shiftKey && event.ctrlKey) {
      event.preventDefault();
      const newFrame = Math.min(activeTotalFrames - 1, activeCurrentFrame + 1);
      if (newFrame !== activeCurrentFrame) {
        updateSceneState(activeSceneId, { currentFrame: newFrame });
      }
    }
    // Go to start frame
    if (event.key === 'ArrowLeft' && event.ctrlKey && event.altKey) {
      event.preventDefault();
      if (activeCurrentFrame !== 0) {
        updateSceneState(activeSceneId, { currentFrame: 0 });
      }
    }
    // Go to end frame (Optional - Let's use Ctrl+Alt+Right)
    if (event.key === 'ArrowRight' && event.ctrlKey && event.altKey) {
      event.preventDefault();
      const lastFrame = activeTotalFrames - 1;
      if (activeCurrentFrame !== lastFrame) {
        updateSceneState(activeSceneId, { currentFrame: lastFrame });
      }
    }

    // Layer Specific Shortcuts (only if a layer is selected)
    if (selectedLayerId) {
      // Toggle Visibility
      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        toggleLayerVisibility(selectedLayerId);
      }
      // Toggle Loop (Conditional based on layer type)
      if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (selectedLayer && selectedLayer.type === 'group') {
          toggleGroupLoop(selectedLayerId);
        } else {
          toggleLayerLoop(selectedLayerId);
        }
      }
      // Add Keyframe at Pending Marker
      if (event.key === 'a' || event.key === 'A') {
        if (pendingKeyframeMarker && pendingKeyframeMarker.layerId === selectedLayerId) {
          event.preventDefault();
          console.log(`Shortcut 'A': Adding keyframe for layer ${selectedLayerId} at frame ${pendingKeyframeMarker.frame}`);
          handleAddKeyframeAtFrame(selectedLayerId, pendingKeyframeMarker.frame);
          // The handleAddKeyframeAtFrame function in App.tsx should clear the pending marker itself.
        } else {
          console.log(`Shortcut 'A': Condition not met (selectedLayerId: ${selectedLayerId}, pendingMarker: ${JSON.stringify(pendingKeyframeMarker)})`);
        }
      }
    }

    // Undo / Redo
    if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
      event.preventDefault();
      undo();
    }
    if (
      (event.key === 'y' && (event.ctrlKey || event.metaKey)) ||
      (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey)
    ) {
      event.preventDefault();
      redo();
    }

    // Save
    if (event.key === 's' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
      event.preventDefault();
      saveProject();
    }

    // Duplicate selected layer
    if (event.key === 'd' && (event.ctrlKey || event.metaKey) && selectedLayerId) {
      event.preventDefault();
      duplicateLayer(selectedLayerId);
    }

    // Copy selected layer
    if (event.key === 'c' && (event.ctrlKey || event.metaKey) && selectedLayerId) {
      event.preventDefault();
      copyLayer(selectedLayerId);
    }

    // Paste layer (to current scene)
    if (event.key === 'v' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
      event.preventDefault();
      pasteLayer();
    }

    // Paste layer to all scenes
    if (event.key === 'v' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      event.preventDefault();
      pasteLayerToAllScenes();
    }
  }, [
    togglePlay, 
    updateSceneState, 
    activeSceneId, 
    activeCurrentFrame, 
    activeTotalFrames, 
    selectedLayerId,       
    toggleLayerVisibility, 
    toggleLayerLoop,
    pendingKeyframeMarker,
    handleAddKeyframeAtFrame,
    layers,
    toggleGroupLoop,
    undo,
    redo,
    saveProject,
    duplicateLayer,
    copyLayer,
    pasteLayer,
    pasteLayerToAllScenes,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Note: We still pass prev/nextFrameKeyHandlers, but they are now managed by the
  // TimelineControls hook which uses updateSceneState internally.
  // The keyboard shortcuts hook only handles the single-press actions.
}; 