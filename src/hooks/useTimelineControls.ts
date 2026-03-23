import { useRef, useCallback, useEffect } from 'react';
import {
  Keyframe,
  LayerData,
  AnimationData,
  AnimationScene,
  LayerProperty,
} from '@/types';
import { useRepeatingAction } from './useRepeatingAction';

// --- Types (Copied from src/types/index.ts for hook definition) ---
// Using specific types defined in types/index.ts for clarity
type TimelineControlsHookArgs = {
  activeSceneId: string;
  activeTotalFrames: number; // Kept based on App.tsx usage, seems needed for calculations
  activeFps: number; // Added based on types/index.ts definition
  activeAnimations: AnimationData[];
  activeLayers: LayerData[];
  activeCurrentFrame: number;
  activeIsPlaying: boolean;
  updateSceneState: (sceneId: string, updates: Partial<Pick<AnimationScene, 'currentFrame' | 'isPlaying'>>) => void;
  timelineAreaRef: React.RefObject<HTMLDivElement | null>; // Corrected type
  setScenes: React.Dispatch<React.SetStateAction<AnimationScene[]>>;
  setEditingKeyframe: React.Dispatch<React.SetStateAction<{ layerId: string; index: number } | null>>;
};

type UseTimelineControlsReturn = {
  handleAddKeyframeForLayer: (layerId: string) => void;
  handleDeleteKeyframe: (layerId: string, index: number) => void;
  handleUpdateKeyframeFrame: (layerId: string, index: number, newFrame: number) => void;
  handleBulkMoveKeyframes: (moves: { layerId: string; index: number; toFrame: number }[]) => void;
  handleTimelineMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handlePlayheadMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  // Updated handleSetKeyframeProperty signature (frame added implicitly)
  handleSetKeyframeProperty: (layerId: string, property: LayerProperty, value: number | string) => void;
  togglePlay: () => void;
  stopAnimation: () => void;
  prevFrameKeyHandlers: ReturnType<typeof useRepeatingAction>; // Match return type
  nextFrameKeyHandlers: ReturnType<typeof useRepeatingAction>; // Match return type
};

// --- Utility Functions (Merged from timelineControls.ts) ---

// Calculate timeline position based on click/drag
const calculateTimelinePosition = (
  clientX: number,
  timelineElement: HTMLElement,
  totalFrames: number
): number => {
  const rect = timelineElement.getBoundingClientRect();
  const x = clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  // Ensure frame is within valid bounds [0, totalFrames - 1]
  return Math.max(0, Math.min(totalFrames - 1, Math.floor(percentage * totalFrames)));
};

// --- The Hook ---

export const useTimelineControls = ({
  activeSceneId,
  activeTotalFrames,
  activeFps,
  activeAnimations,
  activeLayers,
  activeCurrentFrame,
  activeIsPlaying,
  updateSceneState,
  timelineAreaRef, // Use the passed ref
  setScenes,
  setEditingKeyframe,
}: TimelineControlsHookArgs): UseTimelineControlsReturn => {

  // Ref for animation frame requests
  const animationFrameRequestRef = useRef<number | null>(null);
  const currentFrameRef = useRef(activeCurrentFrame);
  const isPlayingRef = useRef(activeIsPlaying);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    currentFrameRef.current = activeCurrentFrame;
  }, [activeCurrentFrame]);

  useEffect(() => {
    isPlayingRef.current = activeIsPlaying;
    if (!activeIsPlaying) {
      lastTimestampRef.current = null;
    }
  }, [activeIsPlaying]);

  // --- Playback Control Logic ---

  const togglePlay = useCallback(() => {
    const newIsPlaying = !activeIsPlaying;
    if (!newIsPlaying && animationFrameRequestRef.current !== null) {
      // If stopping, cancel frame
      cancelAnimationFrame(animationFrameRequestRef.current);
      animationFrameRequestRef.current = null;
    }
    if (newIsPlaying) {
      lastTimestampRef.current = null;
    }
    // Update scene state via callback FIRST
    updateSceneState(activeSceneId, { isPlaying: newIsPlaying });
  }, [activeIsPlaying, updateSceneState, activeSceneId, animationFrameRequestRef]);

  const stopAnimation = useCallback(() => {
    // Cancel any running animation frame
    if (animationFrameRequestRef.current !== null) {
      cancelAnimationFrame(animationFrameRequestRef.current);
      animationFrameRequestRef.current = null;
    }
    // Reset to frame 0 and ensure isPlaying is false via callback
    currentFrameRef.current = 0;
    lastTimestampRef.current = null;
    updateSceneState(activeSceneId, { currentFrame: 0, isPlaying: false });
  }, [updateSceneState, activeSceneId, animationFrameRequestRef]);


  // --- Animation Loop ---
  const runAnimationLoop = useCallback((timestamp: number) => {
    // This function will be called recursively by requestAnimationFrame
    // We check activeIsPlaying inside the loop to decide whether to continue

    if (!isPlayingRef.current) { // Check scene state directly
      animationFrameRequestRef.current = null; // Ensure ref is cleared if stopped externally
      return; // Stop the loop if no longer playing
    }

    const frameDurationMs = 1000 / activeFps;

    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
    }

    const elapsed = timestamp - lastTimestampRef.current;
    const framesToAdvance = Math.floor(elapsed / frameDurationMs);

    if (framesToAdvance > 0) {
      lastTimestampRef.current += framesToAdvance * frameDurationMs;
      const nextFrame = (currentFrameRef.current + framesToAdvance) % activeTotalFrames;
      currentFrameRef.current = nextFrame;
      updateSceneState(activeSceneId, { currentFrame: nextFrame });
    }

    // Request the next frame - crucial: this continues the loop
    animationFrameRequestRef.current = requestAnimationFrame(runAnimationLoop);

  }, [activeFps, activeTotalFrames, updateSceneState, activeSceneId]);


  // Effect to start/stop the animation loop based on activeIsPlaying
  useEffect(() => {
    if (activeIsPlaying) {
      // Only start if not already running
      if (animationFrameRequestRef.current === null) {
          animationFrameRequestRef.current = requestAnimationFrame(runAnimationLoop);
      }
    } else {
      // If stopping, cancel any existing frame request
      if (animationFrameRequestRef.current !== null) {
        cancelAnimationFrame(animationFrameRequestRef.current);
        animationFrameRequestRef.current = null;
      }
    }

    // Cleanup: Ensure frame is cancelled if component unmounts or dependencies change
    return () => {
      if (animationFrameRequestRef.current !== null) {
        cancelAnimationFrame(animationFrameRequestRef.current);
        animationFrameRequestRef.current = null;
      }
    };
  }, [activeIsPlaying, runAnimationLoop]); // Depend only on playing state and the loop function


  // --- Frame Navigation ---
  const goToFrame = useCallback((targetFrame: number) => {
    const clampedFrame = Math.max(0, Math.min(activeTotalFrames - 1, targetFrame));
    if (clampedFrame !== activeCurrentFrame) {
        updateSceneState(activeSceneId, { currentFrame: clampedFrame });
    }
  }, [activeTotalFrames, activeCurrentFrame, updateSceneState, activeSceneId]);

  const stepFrame = useCallback((delta: number) => {
    goToFrame(activeCurrentFrame + delta);
  }, [activeCurrentFrame, goToFrame]);

  // Create stable callback references for stepping actions
  const stepBackwardAction = useCallback(() => stepFrame(-1), [stepFrame]);
  const stepForwardAction = useCallback(() => stepFrame(1), [stepFrame]);

  // --- Generate Button Handlers --- 
  // Pass the stable callbacks to useRepeatingAction
  const prevFrameKeyHandlers = useRepeatingAction(stepBackwardAction);
  const nextFrameKeyHandlers = useRepeatingAction(stepForwardAction);

  // --- Keyframe Management Logic ---

  // Helper to get base layer properties or previous keyframe properties
  const getSourceProperties = useCallback((layerId: string, targetFrame: number): Partial<Keyframe> => {
    const layer = activeLayers.find(l => l.id === layerId);
    const animation = activeAnimations.find(a => a.layerId === layerId);
    if (!layer) return {};

    const prevKeyframe = animation
      ? [...animation.keyframes] // Create a copy to sort
          .sort((a, b) => a.frame - b.frame) // Sort ascending by frame
          .filter(kf => kf.frame < targetFrame) // Get keyframes before target
          .pop() // Get the last one (closest previous)
      : undefined;

    // Base properties from the layer itself (ensure correct types)
    const baseProps: Partial<Keyframe> = {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      opacity: layer.opacity,
      rotation: layer.rotation ?? 0, // Default rotation if undefined
      scaleX: layer.scaleX ?? 1,
      scaleY: layer.scaleY ?? 1,
      // Add other relevant properties from LayerData if needed for keyframes
      // e.g., fill for color layers, fontSize for text, etc.
    };
     if (layer.type === 'text') {
        baseProps.fontSize = layer.font.size;
        baseProps.letterSpacing = layer.font.letterSpacing;
        baseProps.color = layer.fill; // Use fill as keyframe color property? Check definition
     } else if (layer.type === 'color') {
         baseProps.color = layer.fill;
     }

    // If a previous keyframe exists, use its properties as the base
    if (prevKeyframe) {
      // Merge base layer props with previous keyframe props, keyframe taking precedence
       const { ...prevProps } = prevKeyframe;
       return { ...baseProps, ...prevProps };
    }

    return baseProps; // Otherwise, use the base layer properties
  }, [activeLayers, activeAnimations]);

  // Add Keyframe for a layer at the current frame
  const handleAddKeyframeForLayer = useCallback((layerId: string) => {
    const targetFrame = activeCurrentFrame;
    console.log(`[TimelineControls] Attempting to add keyframe for ${layerId} at frame ${targetFrame}`);

    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;

      const layer = scene.layers.find(l => l.id === layerId);
      if (!layer) {
          console.warn(`[TimelineControls] Layer ${layerId} not found in scene ${scene.id}.`);
          return scene; // Layer not found in this scene
      }

      const animIndex = scene.animations.findIndex(a => a.layerId === layerId);
      const updatedAnimations = [...scene.animations]; // Use const

      // Properties to inherit/set for the new keyframe
      const sourceProps = getSourceProperties(layerId, targetFrame);

      const newKeyframe: Keyframe = {
        frame: targetFrame,
        ...sourceProps, // Include inherited/base properties
        // Add default easing if needed, or let it be undefined
        // easing: 'linear',
      };
       console.log(`[TimelineControls] New keyframe props for ${layerId}:`, newKeyframe);

      if (animIndex === -1) {
        // Animation doesn't exist, create it with the new keyframe
        console.log(`[TimelineControls] Creating new animation data for ${layerId}`);
        updatedAnimations.push({
          layerId: layerId,
          loop: true, // Default loop state?
          keyframes: [newKeyframe],
        });
      } else {
        // Animation exists, add keyframe if it doesn't exist at this frame
        const existingKeyframeIndex = updatedAnimations[animIndex].keyframes.findIndex(kf => kf.frame === targetFrame);
        if (existingKeyframeIndex === -1) {
          console.log(`[TimelineControls] Adding keyframe to existing animation for ${layerId}`);
          const newKeyframes = [...updatedAnimations[animIndex].keyframes, newKeyframe];
          newKeyframes.sort((a, b) => a.frame - b.frame); // Keep sorted
          updatedAnimations[animIndex] = { ...updatedAnimations[animIndex], keyframes: newKeyframes };
        } else {
           console.log(`[TimelineControls] Keyframe already exists for ${layerId} at frame ${targetFrame}. No action taken.`);
           return scene; // Return unchanged scene if keyframe exists
        }
      }

      return { ...scene, animations: updatedAnimations, hasUnsavedChanges: true };
    }));

    // Update editing keyframe state *after* the scenes state update likely completes
    // (useEffect might be more robust, but this is simpler for now)
    setTimeout(() => {
       setScenes(currentScenes => {
           const scene = currentScenes.find((s: AnimationScene) => s.id === activeSceneId);
           const anim = scene?.animations.find((a: AnimationData) => a.layerId === layerId);
           const newIndex = anim?.keyframes.findIndex((kf: Keyframe) => kf.frame === targetFrame) ?? -1;
           if (newIndex !== -1) {
               setEditingKeyframe({ layerId, index: newIndex });
           }
           return currentScenes; // Return unchanged scenes
       });
    }, 0);

  }, [activeCurrentFrame, setScenes, activeSceneId, getSourceProperties, setEditingKeyframe]);


  // Delete Keyframe by layerId and keyframe index
  const handleDeleteKeyframe = useCallback((layerId: string, index: number) => {
    console.log(`[TimelineControls] Deleting keyframe index ${index} for layer ${layerId}`);
    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const animIndex = scene.animations.findIndex(a => a.layerId === layerId);
      if (animIndex === -1 || !scene.animations[animIndex].keyframes[index]) {
        console.warn(`[TimelineControls] Keyframe index ${index} not found for layer ${layerId}.`);
        return scene; // Animation or keyframe not found
      }

      const updatedKeyframes = scene.animations[animIndex].keyframes.filter((_, i) => i !== index);
      const updatedAnimations = [...scene.animations];

      if (updatedKeyframes.length === 0) {
        // Remove animation data if no keyframes left? Maybe keep it.
        // For now, keep the animation object but with empty keyframes
        updatedAnimations[animIndex] = { ...updatedAnimations[animIndex], keyframes: [] };
         console.log(`[TimelineControls] Last keyframe removed for ${layerId}. Keeping animation data.`);
      } else {
        updatedAnimations[animIndex] = { ...updatedAnimations[animIndex], keyframes: updatedKeyframes };
      }

      return { ...scene, animations: updatedAnimations, hasUnsavedChanges: true };
    }));
    setEditingKeyframe(null); // Deselect keyframe after deleting
  }, [setScenes, activeSceneId, setEditingKeyframe]);


  // Update the 'frame' property of a specific keyframe
  const handleUpdateKeyframeFrame = useCallback((layerId: string, index: number, newFrame: number) => {
    const clampedFrame = Math.max(0, Math.min(activeTotalFrames - 1, newFrame));
    console.log(`[TimelineControls] Updating frame for keyframe index ${index} of layer ${layerId} to ${clampedFrame}`);

    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const animIndex = scene.animations.findIndex(a => a.layerId === layerId);
      if (animIndex === -1 || !scene.animations[animIndex].keyframes[index]) {
        console.warn(`[TimelineControls] Keyframe index ${index} not found for layer ${layerId} during frame update.`);
        return scene; // Keyframe not found
      }

      // Check if another keyframe already exists at the new frame
      const targetFrameExists = scene.animations[animIndex].keyframes.some((kf, i) => i !== index && kf.frame === clampedFrame);
      if (targetFrameExists) {
          console.warn(`[TimelineControls] Cannot move keyframe to frame ${clampedFrame}, another keyframe already exists there.`);
          // Optionally provide user feedback here (e.g., via a toast notification)
          return scene; // Prevent moving onto an existing keyframe
      }

      const updatedKeyframes = scene.animations[animIndex].keyframes.map((kf, i) =>
        i === index ? { ...kf, frame: clampedFrame } : kf
      );
      updatedKeyframes.sort((a, b) => a.frame - b.frame); // Re-sort after frame change

      const updatedAnimations = [...scene.animations];
      updatedAnimations[animIndex] = { ...updatedAnimations[animIndex], keyframes: updatedKeyframes };

      return { ...scene, animations: updatedAnimations, hasUnsavedChanges: true };
    }));

    // Update editing keyframe state *after* the scenes state update likely completes
    // (useEffect might be more robust, but this is simpler for now)
    setTimeout(() => {
      setScenes(currentScenes => {
        const scene = currentScenes.find((s: AnimationScene) => s.id === activeSceneId);
        const anim = scene?.animations.find((a: AnimationData) => a.layerId === layerId);
        const newIndex = anim?.keyframes.findIndex((kf: Keyframe) => kf.frame === clampedFrame) ?? -1;
        // Update editing keyframe only if it matches the one being moved
        setEditingKeyframe(prev => {
          if (prev && prev.layerId === layerId && newIndex !== -1) {
            return { layerId, index: newIndex };
          }
          return prev; // Keep previous selection otherwise
        });
        return currentScenes; // Return unchanged scenes
      });
    });

  }, [setScenes, activeSceneId, activeTotalFrames, setEditingKeyframe]);

  const handleBulkMoveKeyframes = useCallback((moves: { layerId: string; index: number; toFrame: number }[]) => {
    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const newAnimations = scene.animations.map(anim => {
        const animMoves = moves.filter(m => m.layerId === anim.layerId);
        if (animMoves.length === 0) return anim;
        const newKeyframes = anim.keyframes.map((kf, idx) => {
          const move = animMoves.find(m => m.index === idx);
          if (!move) return kf;
          const clamped = Math.max(0, Math.min(activeTotalFrames - 1, move.toFrame));
          return { ...kf, frame: clamped };
        });
        return { ...anim, keyframes: newKeyframes };
      });
      return { ...scene, animations: newAnimations, hasUnsavedChanges: true };
    }));
  }, [activeSceneId, activeTotalFrames, setScenes]);

  // Set a specific property on a keyframe (add keyframe if needed)
  const handleSetKeyframeProperty = useCallback((
    layerId: string,
    property: LayerProperty,
    value: number | string
  ) => {
    const targetFrame = activeCurrentFrame; // Use current frame implicitly
    console.log(`[TimelineControls] Setting property '${String(property)}' to '${value}' for layer ${layerId} at frame ${targetFrame}`);

    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;

      const layer = scene.layers.find(l => l.id === layerId);
      if (!layer) {
          console.warn(`[TimelineControls] Layer ${layerId} not found in scene ${scene.id} for property update.`);
          return scene;
      }

      const animIndex = scene.animations.findIndex(a => a.layerId === layerId);
      const updatedAnimations = [...scene.animations];
      let keyframeIndex = -1;

      if (animIndex !== -1) {
        keyframeIndex = updatedAnimations[animIndex].keyframes.findIndex(kf => kf.frame === targetFrame);
      }

      if (keyframeIndex !== -1) {
        // Keyframe exists, update the property
        console.log(` -> Updating existing keyframe index ${keyframeIndex}`);
        const updatedKeyframes = [...updatedAnimations[animIndex].keyframes];
        const updatedKeyframe = {
          ...updatedKeyframes[keyframeIndex],
          [property]: value,
        };
        // Handle easing separately? Or Keyframe type should handle 'easing' string? Assume it does.
        updatedKeyframes[keyframeIndex] = updatedKeyframe;
        updatedAnimations[animIndex] = { ...updatedAnimations[animIndex], keyframes: updatedKeyframes };
      } else {
        // Keyframe doesn't exist, create it
        console.log(` -> Keyframe not found, creating new one`);
        const sourceProps = getSourceProperties(layerId, targetFrame);
        const newKeyframe: Keyframe = {
          frame: targetFrame,
          ...sourceProps, // Inherit base/previous properties
          [property]: value, // Set the specific property being changed
          // easing: 'linear', // Default easing?
        };
        console.log(` -> New keyframe data:`, newKeyframe);

        if (animIndex === -1) {
          // Animation doesn't exist, create it
          console.log(` -> Creating new animation data`);
          updatedAnimations.push({
            layerId: layerId,
            loop: true,
            keyframes: [newKeyframe],
          });
        } else {
          // Animation exists, add the new keyframe and sort
          console.log(` -> Adding keyframe to existing animation`);
          const newKeyframes = [...updatedAnimations[animIndex].keyframes, newKeyframe];
          newKeyframes.sort((a, b) => a.frame - b.frame);
          updatedAnimations[animIndex] = { ...updatedAnimations[animIndex], keyframes: newKeyframes };
           // Find the new index after sorting
           keyframeIndex = newKeyframes.findIndex(kf => kf.frame === targetFrame);
        }
      }

      return { ...scene, animations: updatedAnimations, hasUnsavedChanges: true };
    }));

    // Update editing keyframe state *after* the scenes state update likely completes
    // (useEffect might be more robust, but this is simpler for now)
    setTimeout(() => {
       setScenes(currentScenes => {
           const scene = currentScenes.find((s: AnimationScene) => s.id === activeSceneId);
           const anim = scene?.animations.find((a: AnimationData) => a.layerId === layerId);
           const newIndex = anim?.keyframes.findIndex((kf: Keyframe) => kf.frame === targetFrame) ?? -1;
           if (newIndex !== -1) {
               console.log(`[TimelineControls] Setting editing keyframe to index ${newIndex} for layer ${layerId}`);
               setEditingKeyframe({ layerId, index: newIndex });
           } else {
               console.warn(`[TimelineControls] Could not find new keyframe index for layer ${layerId} at frame ${targetFrame} after update.`);
           }
           return currentScenes; // Return unchanged scenes
       });
    }, 0);

  }, [activeCurrentFrame, setScenes, activeSceneId, getSourceProperties, setEditingKeyframe]);


  // --- Timeline/Playhead Interaction ---

  // Handles drag start on the main timeline area (scrubbing)
  const handleTimelineMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineAreaRef.current || event.button !== 0) return; // Only left click
    event.preventDefault();

    // Pause if playing when scrubbing starts
    if (activeIsPlaying) {
      togglePlay();
    }

    const timelineElement = timelineAreaRef.current;
    const initialFrame = calculateTimelinePosition(event.clientX, timelineElement, activeTotalFrames);
    goToFrame(initialFrame); // Set frame immediately

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const frame = calculateTimelinePosition(moveEvent.clientX, timelineElement, activeTotalFrames);
      goToFrame(frame); // Update frame during drag
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

  }, [timelineAreaRef, activeTotalFrames, activeIsPlaying, goToFrame, togglePlay]);

  // Handles drag start specifically on the playhead element
  const handlePlayheadMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineAreaRef.current || event.button !== 0) return; // Only left click
    event.preventDefault();
    event.stopPropagation(); // Prevent timeline mouse down from firing

    // Pause if playing when scrubbing starts
    if (activeIsPlaying) {
      togglePlay();
    }

    const timelineElement = timelineAreaRef.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const frame = calculateTimelinePosition(moveEvent.clientX, timelineElement, activeTotalFrames);
       goToFrame(frame); // Update frame during drag
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

  }, [timelineAreaRef, activeTotalFrames, activeIsPlaying, goToFrame, togglePlay]);


  // --- Return Hook API ---
  return {
    handleAddKeyframeForLayer,
    handleDeleteKeyframe,
    handleUpdateKeyframeFrame,
    handleBulkMoveKeyframes,
    handleTimelineMouseDown,
    handlePlayheadMouseDown,
    handleSetKeyframeProperty,
    togglePlay,
    stopAnimation,
    prevFrameKeyHandlers,
    nextFrameKeyHandlers,
  };
};
