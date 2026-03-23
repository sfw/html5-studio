import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Square, Plus, Eye, EyeOff, 
  ChevronsLeft, ChevronsRight, GripVertical, 
  Layers as LayersIcon,
  ImageIcon, 
  Type as TypeIcon,
  ChevronLeft,
  ChevronRight,
  Repeat,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Palette,
  Layers,
  Combine,
  Code,
  Lock,
  Unlock,
  Minimize2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LayerData, AnimationData, LayerType, PendingKeyframeMarker } from '@/types/index'; // Adjust path if needed
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Keyframe } from '@/types/index';

// Updated Props for Frame-Based Timeline
interface TimelineSectionProps {
  layers: LayerData[];
  animations: AnimationData[];
  selectedLayerId: string | null;
  editingKeyframe: { layerId: string; index: number } | null;
  currentFrame: number; // Changed from currentTime
  totalFrames: number; // Changed from totalDuration
  fps: number; // Added fps for display/calculations
  isPlaying: boolean;
  isRenaming: string | null;
  onSetCurrentFrame: (frame: number) => void; // ADDED: Use simple function type
  onTogglePlay: () => void;
  onStopAnimation: () => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onAddKeyframe: (layerId: string) => void;
  onAddKeyframeAtFrame: (layerId: string, frame: number) => void;
  onAddNewLayer: (type: LayerType) => void;
  onSelectLayer: (layerId: string) => void;
  onSetEditingKeyframe: (editInfo: { layerId: string; index: number } | null) => void;
  onUpdateKeyframeFrame: (layerId: string, index: number, newFrame: number) => void; // Changed from onUpdateKeyframeTime
  onTimelineMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPlayheadMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSetIsRenaming: (layerId: string | null) => void;
  onUpdateLayerName: (layerId: string, newName: string) => void;
  onReorderLayers: (draggedId: string, targetId: string | null) => void;
  onDeleteKeyframe: (layerId: string, index: number) => void;
  onPasteKeyframe: (layerId: string, frame: number, values: Omit<Keyframe, 'frame'>) => void;
  onBulkMoveKeyframes: (moves: { layerId: string; index: number; toFrame: number }[]) => void;
  onToggleLayerLoop: (layerId: string) => void;
  onToggleGroupLoop: (groupId: string) => void;
  onToggleGroupExpansion: (groupId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
  timelineHeaderRef: React.RefObject<HTMLDivElement | null>;
  timelineAreaRef: React.RefObject<HTMLDivElement | null>;
  groupLoopStates: Map<string, { hasAnimations: boolean; isLooping: boolean }>; // Added prop
  onShowLayersDebug: () => void; // +++ Add prop for showing debug modal
  onCopyLayer: (layerId: string) => void;
  onPasteLayer: () => void;
  onPasteLayerToAllScenes: () => void;
  hasLayerClipboard: boolean;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  pendingKeyframeMarker: PendingKeyframeMarker;
  setPendingKeyframeMarker: (marker: PendingKeyframeMarker) => void;
}

// State type for the pending marker
// --- REMOVED Internal Type --- 
// type PendingKeyframeMarker = { layerId: string; frame: number } | null;
// State type for the keyframe pending deletion confirmation
type KeyframeToDelete = { layerId: string; index: number } | null;

const FRAME_MARKER_INTERVAL = 12; // Show frame number every N frames

// --- Color Palette for Animation Spans ---
const animationSpanColors = [
  'bg-red-500/5 dark:bg-red-400/20',
  'bg-green-500/5 dark:bg-green-400/20',
  'bg-blue-500/5 dark:bg-blue-400/20', // Keep blue as an option
  'bg-yellow-500/5 dark:bg-yellow-400/20',
  'bg-purple-500/5 dark:bg-purple-400/20',
  'bg-pink-500/5 dark:bg-pink-400/20',
  'bg-indigo-500/5 dark:bg-indigo-400/20',
  'bg-teal-500/5 dark:bg-teal-400/20',
];

// Add a new Grid component for reusability
const TimelineGrid: React.FC<{ totalFrames: number; fps: number }> = ({ totalFrames, fps }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: totalFrames }).map((_, frame) => {
        const isMajorTick = frame % fps === 0;
        return (
          <div
            key={frame}
            className={`absolute top-0 bottom-0 border-l ${isMajorTick ? 'border-border' : 'border-border/30'}`}
            style={{ left: `${(frame / totalFrames) * 100}%` }}
          />
        );
      })}
    </div>
  );
};

// Type for the prepared layer structure with indentation and visibility
// Use intersection type as LayerData is a union type
type PreparedLayer = LayerData & {
  indentationLevel: number;
  isVisibleBasedOnHierarchy: boolean;
};

// --- Function to Prepare Hierarchical Layer List (Not used, kept for reference/ideas) --- 
// const prepareHierarchicalLayers = (layers: LayerData[]): PreparedLayer[] => { ... };

const TimelineSection: React.FC<TimelineSectionProps> = ({
  layers,
  animations,
  selectedLayerId,
  editingKeyframe,
  currentFrame,
  totalFrames: totalFramesCount,
  fps,
  isPlaying,
  isRenaming,
  onSetCurrentFrame,
  onTogglePlay,
  onStopAnimation,
  onToggleLayerVisibility,
  onAddKeyframe,
  onAddKeyframeAtFrame,
  onAddNewLayer,
  onSelectLayer,
  onSetEditingKeyframe,
  onUpdateKeyframeFrame,
  onTimelineMouseDown,
  onPlayheadMouseDown,
  onSetIsRenaming,
  onUpdateLayerName,
  onReorderLayers,
  onDeleteKeyframe,
  onPasteKeyframe,
  onBulkMoveKeyframes,
  onToggleLayerLoop,
  onToggleGroupLoop,
  onToggleGroupExpansion,
  onToggleLayerLock,
  timelineHeaderRef,
  timelineAreaRef,
  groupLoopStates,
  onShowLayersDebug,
  onCopyLayer,
  onPasteLayer,
  onPasteLayerToAllScenes,
  hasLayerClipboard,
  onDeleteLayer,
  onDuplicateLayer,
  pendingKeyframeMarker,
  setPendingKeyframeMarker
}) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [compact, setCompact] = useState(() => localStorage.getItem('timeline-compact') === 'true');
  // Add state for keyframe deletion confirmation
  const [isDeleteKeyframeDialogOpen, setIsDeleteKeyframeDialogOpen] = useState(false);
  const [keyframeToDelete, setKeyframeToDelete] = useState<KeyframeToDelete>(null);
  // Keyframe clipboard for copy/paste
  const [keyframeClipboard, setKeyframeClipboard] = useState<Keyframe | null>(null);
  const [selectedKeyframes, setSelectedKeyframes] = useState<{ layerId: string; index: number }[]>([]);
  // Row-level context menu for pasting keyframes on empty timeline space
  const [rowContextMenu, setRowContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);
  // State to manage the potentially invalid input value temporarily
  const [frameInputValue, setFrameInputValue] = useState<string>(currentFrame.toString());
  // State to track hovering over a group's timeline area for parenting
  const [dropIntoGroupId, setDropIntoGroupId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const horizontalScrollContainerRef = useRef<HTMLDivElement>(null);
  const minimapTrackRef = useRef<HTMLDivElement>(null); // Ref for minimap track
  const minimapThumbRef = useRef<HTMLDivElement>(null); // Ref for minimap thumb
  const currentFrameRef = useRef<number>(currentFrame); // Add this ref to track current frame
  const [isPanningMinimap, setIsPanningMinimap] = useState(false); // State for panning
  const panStartXRef = useRef(0); // Ref for starting X during pan
  const initialScrollLeftRef = useRef(0); // Ref for initial scrollLeft during pan

  // Update currentFrameRef whenever currentFrame changes
  useEffect(() => {
    currentFrameRef.current = currentFrame;
  }, [currentFrame]);

  // Update internal input value when external currentFrame changes
  useEffect(() => {
    setFrameInputValue(currentFrame.toString());
  }, [currentFrame]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, layerId: string) => {
    e.dataTransfer.setData('text/plain', layerId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (targetId !== dragOverId) {
        setDragOverId(targetId);
    }
  };

   const handleDragLeave = () => {
    setDragOverId(null);
    setDropIntoGroupId(null); // Clear drop-into state on leave
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string | null) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    // Find the index of the target layer in the *original* layers array
    // Note: 'layers' prop should hold the original, non-reversed array
    const originalTargetIndex = targetId ? layers.findIndex(l => l.id === targetId) : -1;
    // The visually top item corresponds to the last item in the original array
    const isDroppingOnVisuallyTopItem = originalTargetIndex === layers.length - 1;

    if (draggedId && draggedId !== targetId) {
      if (isDroppingOnVisuallyTopItem) {
        // If dropping onto the visually top item, trigger move to end
        onReorderLayers(draggedId, '__MOVE_TO_END__');
      } else {
        // Otherwise, use the regular target ID for insertion before
        onReorderLayers(draggedId, targetId);
      }
    }
    setDragOverId(null);
  };

   const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
     e.currentTarget.style.opacity = '1';
     setDragOverId(null);
   };

  const handleKeyframeClick = (layerId: string, index: number) => {
    const animation = animations.find(a => a.layerId === layerId);
    if (animation && animation.keyframes[index]) {
      // Set the playhead to the frame of the clicked keyframe
      onSetCurrentFrame(animation.keyframes[index].frame);
    }
    onSelectLayer(layerId);
    onSetEditingKeyframe({ layerId, index });
  };

  // Add effect for keyboard deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Delete or Backspace is pressed and a keyframe is selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && editingKeyframe) {
        // Prevent triggering if user is typing in the layer name input
        if (e.target instanceof HTMLInputElement) {
          return;
        }
        e.preventDefault(); // Prevent browser back navigation on backspace
        e.stopPropagation(); // Stop the event from bubbling up to other listeners (like PropertiesPanel)
        // Store the keyframe to delete and open the dialog
        setKeyframeToDelete(editingKeyframe);
        setIsDeleteKeyframeDialogOpen(true);
      }
      // Arrow keys to nudge selected keyframes
      if (selectedKeyframes.length > 0 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        e.stopPropagation();
        const delta = (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1);
        const moves = selectedKeyframes.map(({ layerId, index }) => {
          const anim = animations.find(a => a.layerId === layerId);
          if (!anim || !anim.keyframes[index]) return null;
          return { layerId, index, toFrame: anim.keyframes[index].frame + delta };
        }).filter(Boolean) as { layerId: string; index: number; toFrame: number }[];
        if (moves.length > 0) onBulkMoveKeyframes(moves);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Cleanup listener on unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingKeyframe, selectedKeyframes, animations, onBulkMoveKeyframes]); // Removed onDeleteKeyframe dependency as it's now called from dialog

  // Handler for confirming keyframe deletion
  const handleConfirmDeleteKeyframe = () => {
    if (keyframeToDelete) {
      onDeleteKeyframe(keyframeToDelete.layerId, keyframeToDelete.index);
    }
    setIsDeleteKeyframeDialogOpen(false);
    setKeyframeToDelete(null);
  };

  // Handler for the frame input change
  const handleFrameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrameInputValue(e.target.value);
    // Also update the timeline marker immediately (covers spinner arrow clicks)
    const frameNum = parseInt(e.target.value, 10);
    if (!isNaN(frameNum)) {
      const clampedFrame = Math.max(0, Math.min(totalFramesCount - 1, frameNum));
      onSetCurrentFrame(clampedFrame);
    }
  };

  // Handler to validate and update frame on blur or Enter
  const validateAndUpdateFrame = () => {
    const frameNum = parseInt(frameInputValue, 10);
    if (!isNaN(frameNum)) {
      const clampedFrame = Math.max(0, Math.min(totalFramesCount - 1, frameNum));
      if (clampedFrame !== currentFrame) { // Only update if the value is actually different
         onSetCurrentFrame(clampedFrame);
      }
      // Reset input value to the potentially clamped value if it differs
      setFrameInputValue(clampedFrame.toString());
    } else {
      // If input is invalid, reset to the current frame
      setFrameInputValue(currentFrame.toString());
    }
  };

  const handleFrameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      validateAndUpdateFrame();
      e.currentTarget.blur(); // Remove focus
    }
     if (e.key === 'Escape') {
       setFrameInputValue(currentFrame.toString()); // Reset on Escape
       e.currentTarget.blur();
     }
  };

  // --- Calculate dynamic width based on zoom --- 
  const timelineInnerWidthPercent = useMemo(() => 100 * zoomLevel, [zoomLevel]);
  const frameWidthPercent = useMemo(() => 100 / totalFramesCount, [totalFramesCount]); // Calculate frame width %

  // --- Click handler for timeline row (needs update for zoom/scroll) ---
  const handleTimelineRowClick = useCallback((e: React.MouseEvent<HTMLDivElement>, layerId: string) => {
      setSelectedKeyframes([]);
      e.stopPropagation(); // Prevent triggering header click
      const targetDiv = e.currentTarget;
      const container = horizontalScrollContainerRef.current;
      if (!container) return;

      const rect = targetDiv.getBoundingClientRect();
      const totalContentWidth = targetDiv.scrollWidth; // Use scrollWidth of the row itself
      
      // Calculate click position relative to the start of the scrollable content
      const clickXRelativeToContent = e.clientX - rect.left;
      
      // Calculate percentage based on the total zoomed content width
      const percentage = Math.max(0, Math.min(1, clickXRelativeToContent / totalContentWidth));
      
      const targetFrame = Math.min(totalFramesCount - 1, Math.floor(percentage * totalFramesCount));
      
      // Set the main playhead position
      onSetCurrentFrame(targetFrame);
      // Set the pending marker using the passed setter
      setPendingKeyframeMarker({ layerId: layerId, frame: targetFrame });
      // Select the layer that was clicked
      onSelectLayer(layerId); 
  }, [totalFramesCount, onSetCurrentFrame, onSelectLayer, setPendingKeyframeMarker]);

  // --- Function to Update Minimap Thumb Style --- 
  const updateMinimapThumb = useCallback(() => {
    const scrollContainer = horizontalScrollContainerRef.current;
    const track = minimapTrackRef.current;
    const thumb = minimapThumbRef.current;

    if (!scrollContainer || !track || !thumb) return;

    const { scrollWidth, clientWidth, scrollLeft } = scrollContainer;
    const trackWidth = track.clientWidth;

    if (scrollWidth <= clientWidth) { // No scroll needed
      thumb.style.width = `${trackWidth}px`;
      thumb.style.left = '0px';
      thumb.style.display = 'none'; // Hide thumb if no scrolling
      return;
    }

    thumb.style.display = 'block'; // Show thumb if scrolling

    const thumbWidthRatio = clientWidth / scrollWidth;
    const thumbWidth = Math.max(20, thumbWidthRatio * trackWidth); // Min width for thumb
    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollRatio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
    const maxThumbLeft = trackWidth - thumbWidth;
    const thumbLeft = scrollRatio * maxThumbLeft;

    thumb.style.width = `${thumbWidth}px`;
    thumb.style.left = `${thumbLeft}px`;
  }, []); // This one has no external dependencies

  // --- Panning Handlers (Moved Before Start Handler) --- 
  const handleMinimapPanMove = useCallback((e: MouseEvent) => {
    const scrollContainer = horizontalScrollContainerRef.current;
    const track = minimapTrackRef.current;
    const thumb = minimapThumbRef.current;
    if (!scrollContainer || !track || !thumb) return;

    // Calculate mouse movement relative to the track
    const trackRect = track.getBoundingClientRect();
    const mouseXOnTrack = e.clientX - trackRect.left;
    const mouseDelta = mouseXOnTrack - panStartXRef.current;
    
    // Calculate the equivalent scroll position change
    const trackWidth = track.clientWidth;
    const thumbWidth = thumb.clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth;
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    if (maxThumbLeft <= 0 || maxScrollLeft <= 0) return; // No panning possible

    // Calculate the new thumb position based on initial position + delta
    const initialThumbLeft = (initialScrollLeftRef.current / maxScrollLeft) * maxThumbLeft;
    let newThumbLeft = initialThumbLeft + mouseDelta;
    
    // Clamp the thumb position within the track bounds
    newThumbLeft = Math.max(0, Math.min(maxThumbLeft, newThumbLeft));
    
    // Calculate the corresponding scroll ratio and new scrollLeft
    const newScrollRatio = newThumbLeft / maxThumbLeft;
    const newScrollLeft = newScrollRatio * maxScrollLeft;

    // Update the main container's scrollLeft
    scrollContainer.scrollLeft = newScrollLeft;
    
    // Update the thumb position visually *directly* for smoother feedback during drag
    thumb.style.left = `${newThumbLeft}px`;

  }, []); // Reads refs, no callback dependencies

  const handleMinimapPanEnd = useCallback(() => {
    setIsPanningMinimap(false);
    document.removeEventListener('mousemove', handleMinimapPanMove); // Use handleMinimapPanMove
    document.removeEventListener('mouseup', handleMinimapPanEnd); // Can reference itself ok
    updateMinimapThumb(); 
  }, [updateMinimapThumb, handleMinimapPanMove]); // Depend on the callbacks it interacts with

  const handleMinimapPanStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scrollContainer = horizontalScrollContainerRef.current;
    const track = minimapTrackRef.current;
    if (!scrollContainer || !track) return;

    setIsPanningMinimap(true);
    // Calculate starting X relative to the track element
    const trackRect = track.getBoundingClientRect();
    panStartXRef.current = e.clientX - trackRect.left;
    initialScrollLeftRef.current = scrollContainer.scrollLeft;
    
    document.addEventListener('mousemove', handleMinimapPanMove);
    document.addEventListener('mouseup', handleMinimapPanEnd);
  }, [handleMinimapPanMove, handleMinimapPanEnd]); // Now depends on the callbacks defined above

  // --- Effect to Update Minimap on Zoom/Resize --- 
  useEffect(() => {
    // Update initially and whenever zoom or container size might change
    // Use requestAnimationFrame to ensure DOM has updated after zoom change
    const animationFrameId = requestAnimationFrame(() => {
      updateMinimapThumb();
    });
    
    // Consider adding ResizeObserver if container size changes dynamically
    // For now, assume zoomLevel is the main trigger besides initial render

    // Cleanup function to cancel the frame request if component unmounts or dependencies change
    return () => cancelAnimationFrame(animationFrameId);
  }, [zoomLevel, totalFramesCount, updateMinimapThumb]); // Dependencies remain the same

  // --- Scroll Handler for Main Timeline -> Minimap Sync --- 
  const handleTimelineScroll = useCallback(() => {
    // Update thumb position when the main timeline scrolls
    if (!isPanningMinimap) { // Avoid feedback loop while panning the thumb itself
       updateMinimapThumb();
    }
  }, [updateMinimapThumb, isPanningMinimap]);

  // --- Memoize Keyframe Positions for Minimap ---
  const allKeyframeMarkers = useMemo(() => {
    const markers: { frame: number; isSelectedLayer: boolean }[] = [];
    animations.forEach(anim => {
      const isSelected = anim.layerId === selectedLayerId;
      anim.keyframes.forEach(kf => {
        // Avoid adding duplicate frame numbers unnecessarily, but track selection priority
        const existingIndex = markers.findIndex(m => m.frame === kf.frame);
        if (existingIndex !== -1) {
          // If this keyframe is for the selected layer, mark the marker as selected
          if (isSelected) {
            markers[existingIndex].isSelectedLayer = true;
          }
        } else {
          markers.push({ frame: kf.frame, isSelectedLayer: isSelected });
        }
      });
    });
    // Sort by frame number for consistent rendering order (optional)
    markers.sort((a, b) => a.frame - b.frame);
    return markers;
  }, [animations, selectedLayerId]);

  // --- Handler for Clicking on the Minimap Track --- 
  const handleMinimapTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only process if the click was directly on the track, not the thumb
    if (e.target !== minimapTrackRef.current) {
        return;
    }
    
    const scrollContainer = horizontalScrollContainerRef.current;
    const track = minimapTrackRef.current; // e.currentTarget should also work here
    if (!scrollContainer || !track) return;

    const { scrollWidth, clientWidth } = scrollContainer;
    const trackWidth = track.clientWidth;
    const maxScrollLeft = scrollWidth - clientWidth;

    if (maxScrollLeft <= 0) return; // No scrolling possible

    // Calculate click position relative to the track
    const trackRect = track.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    
    // Calculate the percentage along the track where the click occurred
    const clickPercentage = Math.max(0, Math.min(1, clickX / trackWidth));
    
    // Calculate the target scrollLeft so the clicked point is centered
    // Target center point in pixels = clickPercentage * scrollWidth
    // Target scrollLeft = Target center point - (clientWidth / 2)
    let targetScrollLeft = (clickPercentage * scrollWidth) - (clientWidth / 2);
    
    // Clamp the target scrollLeft within valid bounds
    targetScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft));
    
    // Set the scroll position
    scrollContainer.scrollLeft = targetScrollLeft;

    // Update the thumb immediately for responsiveness (onScroll will also fire)
    updateMinimapThumb(); 

  }, [updateMinimapThumb]); // Include updateMinimapThumb dependency

  // Helper function for frame advancement button handlers
  const createFrameAdvanceHandler = (isNext: boolean) => {
    return () => {
      // Calculate the new frame based on direction
      const newFrame = isNext
        ? Math.min(totalFramesCount - 1, currentFrameRef.current + 1)
        : Math.max(0, currentFrameRef.current - 1);
      
      // Execute immediately first
      onSetCurrentFrame(newFrame);
      
      // Set up repeating functionality
      let isPressed = true;
      let lastTime = performance.now();
      
      const step = () => {
        if (!isPressed) {
          return;
        }
        
        const now = performance.now();
        if (now - lastTime > 50) { // Keep 50ms repeat interval as requested
          // Get the latest frame value from the ref
          const latestFrame = currentFrameRef.current;
          const nextFrame = isNext
            ? Math.min(totalFramesCount - 1, latestFrame + 1)
            : Math.max(0, latestFrame - 1);
          
          onSetCurrentFrame(nextFrame);
          lastTime = now;
        }
        
        requestAnimationFrame(step);
      };
      
      // Start repeating after initial delay
      const timerId = setTimeout(() => {
        if (isPressed) {
          requestAnimationFrame(step);
        }
      }, 200); // Initial delay before repeating
      
      // Setup document-level event handlers for release detection
      const handleMouseUp = () => {
        isPressed = false;
        clearTimeout(timerId);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mouseup', handleMouseUp);
    };
  };

  // --- Prepare Layers for Rendering (On-the-fly calculation) ---
  const preparedLayers = useMemo(() => {
     const layerMap = new Map<string, LayerData>(layers.map(l => [l.id, l]));
     const getParentExpansion = (layer: LayerData): boolean => {
        if (!layer.parentId) return true; // Top level is always visible
        const parent = layerMap.get(layer.parentId);
        if (!parent) return false; // Parent not found (shouldn't happen)
        if (parent.type !== 'group') return true; // Parent isn't a group
        const isParentExpanded = parent.isExpanded === undefined || parent.isExpanded === true;
        // Recursively check grandparent expansion
        return isParentExpanded && getParentExpansion(parent);
     };
     
     const getIndentationLevel = (layer: LayerData, level = 0): number => {
        if (!layer.parentId) return level; // If no parent, return current level (0 for top-level)
        const parent = layerMap.get(layer.parentId);
        if (!parent) {
          return level; // If parent not found, return current level
        }
        // Recursive call: pass the parent and increment level
        const nextLevel = getIndentationLevel(parent, level + 1);
        return nextLevel;
     };

     // Apply calculations to each layer
     const layersCalculated = layers.map(layer => ({
       ...layer,
       isVisibleBasedOnHierarchy: getParentExpansion(layer),
       indentationLevel: getIndentationLevel(layer)
     })) as PreparedLayer[]; 

     return layersCalculated;
  }, [layers]); // Only depends on layers

  return (
    <div className="border-t border-border flex flex-col">
      {/* Timeline Controls */}
      <div className="flex items-center p-2 border-b border-border bg-secondary/30">
        <div className="flex items-center space-x-1">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onSetCurrentFrame(0)} className="h-7 w-7"><ChevronsLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Go to Start Frame (Ctrl+Alt+Left)</p></TooltipContent></Tooltip>
          
          {/* Previous Frame Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onMouseDown={createFrameAdvanceHandler(false)}
                className="h-7 w-7"
              >
                 <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Previous Frame (Hold) (Shift+Ctrl+Left)</p></TooltipContent>
          </Tooltip>
            
          <Tooltip>
             <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { 
                    onTogglePlay(); 
                  }} 
                  className="h-7 w-7"
                >
                   {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
             </TooltipTrigger>
             <TooltipContent><p>{isPlaying ? 'Pause' : 'Play'} (Spacebar)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { 
                  onStopAnimation(); 
                }} 
                className="h-7 w-7"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Stop (Go to Frame 0)</p></TooltipContent>
          </Tooltip>

          {/* Next Frame Button */} 
          <Tooltip>
             <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onMouseDown={createFrameAdvanceHandler(true)}
                  className="h-7 w-7"
                >
                   <ChevronRight className="h-4 w-4" />
                </Button>
             </TooltipTrigger>
             <TooltipContent><p>Next Frame (Hold) (Shift+Ctrl+Right)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onSetCurrentFrame(totalFramesCount - 1)} className="h-7 w-7">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Go to End Frame (Ctrl+Alt+Right)</p></TooltipContent>
          </Tooltip>
        </div>
        {/* Frame Indicator/Input */}
        <div className="ml-4 flex items-center space-x-1 text-sm text-muted-foreground tabular-nums">
          <span>Frame:</span>
          <Input
            type="number" // Use number type for basic validation/spinners (though visually hidden)
            value={frameInputValue}
            onChange={handleFrameInputChange}
            onBlur={validateAndUpdateFrame} 
            onKeyDown={handleFrameInputKeyDown}
            min={0} // Semantic min/max
            max={totalFramesCount - 1}
            className="h-6 w-16 text-center px-1 appearance-none m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Basic styling, hide spinners
          />
          <span>/ {totalFramesCount - 1} ({fps} FPS)</span>
        </div>

        {/* +++ Add Layer Dropdown (Right Aligned) +++ */}
        <div className="ml-auto flex items-center space-x-1">
           {/* Compact Mode Toggle */}
           <Tooltip>
             <TooltipTrigger asChild>
               <Button variant={compact ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => { const v = !compact; setCompact(v); localStorage.setItem('timeline-compact', String(v)); }}>
                 <Minimize2 className="h-4 w-4" />
               </Button>
             </TooltipTrigger>
             <TooltipContent><p>Compact Mode</p></TooltipContent>
           </Tooltip>
           {/* +++ Layers Debug Button +++ */}
           <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="outline" size="icon" className="h-7 w-7" onClick={onShowLayersDebug}>
                    <Code className="h-4 w-4" />
                 </Button>
              </TooltipTrigger>
              <TooltipContent><p>Show Layers JSON</p></TooltipContent>
           </Tooltip>

           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="icon" className="h-7 w-7">
                 <Plus className="h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuLabel>Add New Layer</DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => onAddNewLayer('color')}>
                 <Palette className="mr-2 h-4 w-4" />
                 <span>Color</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onAddNewLayer('gradient')}>
                 <Layers className="mr-2 h-4 w-4" />
                 <span>Gradient</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onAddNewLayer('text')}>
                 <TypeIcon className="mr-2 h-4 w-4" />
                 <span>Text</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onAddNewLayer('image')}>
                 <ImageIcon className="mr-2 h-4 w-4" />
                 <span>Image</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => onAddNewLayer('group')}>
                 <Combine className="mr-2 h-4 w-4" />
                 <span>Group Layer</span>
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      {/* Timeline Grid Container - Added Ref for horizontal scrolling */}
      <div 
        ref={horizontalScrollContainerRef} 
        className="flex-1 flex flex-col max-h-[40vh] overflow-x-auto overflow-y-hidden" 
        onScroll={handleTimelineScroll} // Attach scroll handler
      > {/* Changed layout to allow horizontal scroll */} 
        {/* Wrapper for Header and Layers to allow them to expand horizontally */} 
        <div style={{ width: `${timelineInnerWidthPercent}%` }} className="min-w-full flex flex-col h-full"> {/* Inner container takes dynamic width */}
            {/* Timeline Header */} 
            <div className="flex border-b border-border sticky top-0 bg-background z-20" ref={timelineHeaderRef}>
              {/* Layer Name Column (Fixed Width) */} 
              <div className="w-48 p-2 border-r border-border text-xs font-semibold text-muted-foreground sticky left-0 bg-background z-10">Layer Name</div> 
              {/* Timeline Ruler Area (Scrollable) */} 
              <div 
                ref={timelineAreaRef}
                className="flex-1 relative h-8 cursor-pointer" 
                onMouseDown={onTimelineMouseDown}
              > 
                {/* Frame markers */}
                {Array.from({ length: totalFramesCount }).map((_, frame) => {
                  const showLabel = frame % FRAME_MARKER_INTERVAL === 0 || frame === totalFramesCount - 1;
                  const isMajorTick = frame % fps === 0;
                  const leftPercent = (frame / totalFramesCount) * 100;
                  return (
                    <div
                      key={frame}
                      className={`absolute top-0 bottom-0 border-l ${isMajorTick ? 'border-border' : 'border-border/30'} text-muted-foreground/70 pt-0.5`}
                      style={{ left: `${leftPercent}%` }}
                    >
                      {isMajorTick && (
                        <span className="ml-0.5 select-none block text-[9px] leading-tight font-medium text-muted-foreground">
                          {Math.floor(frame / fps)}s
                        </span>
                      )}
                      {showLabel && !isMajorTick && (
                        <span className="ml-0.5 select-none block text-[9px] leading-tight text-muted-foreground/60">
                          {frame}
                        </span>
                      )}
                    </div>
                  );
                })}
                {/* Playhead */} 
                {/* Needs to be positioned relative to the zoomed container */} 
                <div 
                    className="group absolute top-0 bottom-0 z-20 cursor-ew-resize bg-primary/5 border border-transparent group-hover:border-primary/30 transition-colors duration-150"
                    style={{ 
                        left: `${(currentFrame / Math.max(1, totalFramesCount)) * 100}%`, 
                        width: `${frameWidthPercent}%` // Set width to fill frame block
                    }}
                    onMouseDown={onPlayheadMouseDown} // Attach drag handler to the block
                >
                  {/* Downward pointing triangle at the bottom center */} 
                  <svg 
                     viewBox="0 0 10 5" 
                     className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1.5 fill-cyan-600"
                     style={{ marginBottom: '-0.1rem' }} // Slight adjustment to touch the bottom edge
                  >
                    <polygon points="0,0 10,0 5,5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Layers Scroll Container (Now only vertical scroll) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" data-timeline-area="true"> {/* Vertical scroll only here */}
              {/* Render based on layers prop, but reverse it first */}
              {preparedLayers // --- Use preparedLayers calculated earlier ---
                .slice() // Create a shallow copy
                .reverse() // Reverse the copy for rendering order
                .map((layer) => { // Process preparedLayers directly
                  const layerIndentation = layer.indentationLevel; // --- Use from preparedLayers ---
                  const isVisibleBasedOnHierarchy = layer.isVisibleBasedOnHierarchy; // --- Use from preparedLayers ---
                  
                  // Filter out hidden layers *after* processing
                  if (!isVisibleBasedOnHierarchy) return null;
                   
                  const layerAnimation = animations.find(a => a.layerId === layer.id);
                  const isLooping = layerAnimation?.loop ?? false;
                  const isSelected = selectedLayerId === layer.id;
                  const isDragOver = dragOverId === layer.id;
                  const isGroup = layer.type === 'group';
                  // Default to expanded if undefined
                  const isExpanded = isGroup ? (layer.isExpanded === undefined || layer.isExpanded) : false; 
                  
                  // --- Get Group Loop State --- 
                  let groupHasAnimations = false;
                  let groupIsLooping = false;
                  if (isGroup && groupLoopStates) {
                    const groupState = groupLoopStates.get(layer.id);
                    groupHasAnimations = groupState?.hasAnimations ?? false;
                    groupIsLooping = groupState?.isLooping ?? false;
                  }

                  return (
                    <div
                      key={layer.id}
                      className={`flex border-b border-border transition-all duration-150 ${isSelected ? 'bg-red-100/40 dark:bg-red-950/30' : 'hover:bg-muted/5'} ${isDragOver ? 'border-t-2 border-t-destructive' : ''}`}
                      onClick={() => onSelectLayer(layer.id)}
                    >
                      {/* Layer Info & Controls (Apply Indentation) */}
                      <div
                         className={`w-48 p-1 flex items-center space-x-1 border-r border-border sticky left-0 z-10 ${isSelected ? 'border-l-2 border-l-red-500 bg-red-100/10 dark:bg-red-950/10' : 'bg-background'} ${layerIndentation > 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}
                         onDragOver={(e) => handleDragOver(e, layer.id)} // Keep drag handlers here
                         onDragLeave={handleDragLeave}
                         onDrop={(e) => handleDrop(e, layer.id)}
                      >
                         {/* Drag Handle - Moved to Far Left */}
                         <div
                           draggable="true"
                           onDragStart={(e) => {
                             e.stopPropagation();
                             handleDragStart(e, layer.id);
                           }}
                           onDragEnd={handleDragEnd}
                           className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground pr-1" // Removed -ml-1 for now
                           title="Drag to reorder layer"
                           style={{ marginLeft: `${layerIndentation * 0.75}rem` }} // Subtle indent for handle only
                         >
                           <GripVertical className="h-4 w-4" />
                         </div>

                         {/* Indentation Spacer/Chevron (Conditional Width) */}
                         <div style={{ width: isGroup ? '1.25rem' : '0rem' }} className="flex items-center justify-center transition-all duration-150 shrink-0"> {/* Ensure it shrinks */}
                           {isGroup && ( // Content only for groups
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-5 w-5 shrink-0"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onToggleGroupExpansion(layer.id);
                                 }}
                                title={isExpanded ? "Collapse Group" : "Expand Group"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                           </div>

                         {/* Layer Type Icon (excluding group folder) */}
                         <span className="text-muted-foreground shrink-0" title={`Layer Type: ${layer.type}`}> {/* Ensure it shrinks */}
                           {!isGroup && (() => {
                              const iconProps = { className: "h-3.5 w-3.5" };
                              switch (layer.type) {
                                 case 'color': return <Square {...iconProps} />;
                                 case 'gradient': return <LayersIcon {...iconProps} />;
                                 case 'image': return <ImageIcon {...iconProps} />;
                                 case 'text': return <TypeIcon {...iconProps} />;
                                 default: return null;
                              }
                           })()}
                         </span>

                         {/* Visibility Toggle */}
                         <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(layer.id); }}>{layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}</Button></TooltipTrigger><TooltipContent><p>{layer.visible ? 'Hide Layer' : 'Show Layer'} (V)</p></TooltipContent></Tooltip>

                         {/* Lock Toggle */}
                         <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onToggleLayerLock(layer.id); }}>{layer.locked ? <Lock className="h-3.5 w-3.5 text-amber-400" /> : <Unlock className="h-3.5 w-3.5 text-muted-foreground opacity-40 hover:opacity-100" />}</Button></TooltipTrigger><TooltipContent><p>{layer.locked ? 'Unlock Layer' : 'Lock Layer'}</p></TooltipContent></Tooltip>

                         {/* Loop Toggle Button - NON-GROUP */}
                         {!isGroup && (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-6 w-6 shrink-0"
                                 disabled={!layerAnimation}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (layerAnimation) {
                                     onToggleLayerLoop(layer.id);
                                   }
                                 }}
                                 title={layerAnimation ? (isLooping ? "Looping: On" : "Looping: Off") : "No animation data"}
                               >
                                 {isLooping ? (
                                   <Repeat className="h-3.5 w-3.5 text-primary" />
                                 ) : (
                                   <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                 )}
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               {layerAnimation ? (
                                 <p>Looping: {isLooping ? 'On' : 'Off'} (L)</p>
                               ) : (
                                 <p>Add keyframes to enable looping controls.</p>
                               )}
                             </TooltipContent>
                           </Tooltip>
                         )}

                         {/* Loop Toggle Button - GROUP */}
                         {isGroup && (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-6 w-6 shrink-0"
                                 disabled={!groupHasAnimations}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onToggleGroupLoop(layer.id);
                                 }}
                                 title={groupHasAnimations ? (groupIsLooping ? "Group Looping: On" : "Group Looping: Off") : "Group has no animations"}
                               >
                                 {groupIsLooping ? (
                                   <Repeat className="h-3.5 w-3.5 text-primary" />
                                 ) : (
                                   <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                 )}
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               {groupHasAnimations ? (
                                 <p>Group Looping: {groupIsLooping ? 'On' : 'Off'} (L) </p>
                               ) : (
                                 <p>No layers in this group have keyframes.</p>
                               )}
                             </TooltipContent>
                           </Tooltip>
                         )}

                         {/* Add Keyframe Button */}
                         <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onAddKeyframe(layer.id); }}><Plus className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent><p>Add Keyframe (A)</p></TooltipContent></Tooltip>

                         {/* Layer Name */}
                         <ContextMenu>
                           <ContextMenuTrigger asChild>
                             <div className="flex-1 min-w-0">
                               {isRenaming === layer.id ? (
                                 <Input className="h-6 text-sm" value={layer.name} autoFocus onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdateLayerName(layer.id, e.target.value)} onBlur={() => onSetIsRenaming(null)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onSetIsRenaming(null); }} />
                               ) : (
                                 <span className="text-xs truncate block cursor-pointer p-1 rounded hover:bg-muted" title={layer.name} onDoubleClick={(e) => { e.stopPropagation(); onSetIsRenaming(layer.id); }}>{layer.name}</span>
                               )}
                             </div>
                           </ContextMenuTrigger>
                           <ContextMenuContent>
                             <ContextMenuItem onClick={(e) => { e.stopPropagation(); onCopyLayer(layer.id); }}>
                               Copy Layer
                             </ContextMenuItem>
                             <ContextMenuItem disabled={!hasLayerClipboard} onClick={(e) => { e.stopPropagation(); onPasteLayer(); }}>
                               Paste Layer
                             </ContextMenuItem>
                             <ContextMenuItem disabled={!hasLayerClipboard} onClick={(e) => { e.stopPropagation(); onPasteLayerToAllScenes(); }}>
                               Paste to All Scenes
                             </ContextMenuItem>
                             <ContextMenuSeparator />
                             <ContextMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateLayer(layer.id); }}>
                               Duplicate Layer
                             </ContextMenuItem>
                             <ContextMenuSeparator />
                             <ContextMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}>
                               Delete Layer
                             </ContextMenuItem>
                           </ContextMenuContent>
                         </ContextMenu>
                      </div> {/* End Layer Info & Controls */}

                      {/* Layer Timeline Area (Expands Horizontally) */}
                      <div
                        className={`flex-1 relative ${compact ? 'h-6' : 'h-10'} cursor-pointer ${isGroup && dropIntoGroupId === layer.id ? 'bg-green-500/10' : ''}`} // Add drop-into highlight
                        data-timeline-layer-row="true"
                        onClick={(e) => handleTimelineRowClick(e, layer.id)} // Use new handler
                        onContextMenu={(e) => {
                          // Only show row-level paste menu when right-clicking empty space (not a keyframe)
                          if ((e.target as HTMLElement).closest('[data-keyframe]')) return;
                          e.preventDefault();
                          setRowContextMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
                        }}
                        // Add handlers ONLY for group layers for the "drop into" action
                        onDragOver={isGroup ? (e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Prevent triggering parent dragOver
                          e.dataTransfer.dropEffect = 'move';
                          if (layer.id !== dropIntoGroupId) {
                             setDropIntoGroupId(layer.id); // Set state for highlight
                             setDragOverId(null); // Ensure only one highlight active
                          }
                        } : undefined}
                        onDragLeave={isGroup ? (e) => {
                            e.stopPropagation();
                            // Only clear if leaving the specific target
                            if (e.currentTarget.contains(e.relatedTarget as Node)) return; 
                            setDropIntoGroupId(null); 
                        } : undefined}
                        onDrop={isGroup ? (e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent triggering parent drop
                            const draggedId = e.dataTransfer.getData('text/plain');
                            if (draggedId && draggedId !== layer.id) {
                              // Pass targetId with a prefix to indicate parenting action
                              onReorderLayers(draggedId, `parent:${layer.id}`); 
                            }
                            setDropIntoGroupId(null); // Clear state on drop
                            setDragOverId(null);
                        } : undefined}
                      > 
                        {/* Add grid to layer timeline */} 
                        <TimelineGrid totalFrames={totalFramesCount} fps={fps} />
                        
                        {/* Pending Keyframe Marker (uses prop now) */} 
                        {pendingKeyframeMarker && pendingKeyframeMarker.layerId === layer.id && 
                           !layerAnimation?.keyframes.some(kf => kf.frame === pendingKeyframeMarker.frame) && 
                           (() => {
                             const framePosition = (pendingKeyframeMarker.frame / totalFramesCount) * 100;
                             return (
                               <div
                                 className="absolute top-0 bottom-0 bg-gray-300/50 dark:bg-gray-600/40 pointer-events-none"
                                 style={{
                                   left: `${framePosition}%`,
                                   width: `${frameWidthPercent}%`, // Use calculated frame width %
                                   zIndex: 5 
                                 }}
                               />
                             );
                           })()
                         }
                        
                        {/* Keyframes */} 
                        {layerAnimation && (
                          <div className="absolute inset-0">
                            {layerAnimation.keyframes.map((kf, index) => {
                              const framePosition = (kf.frame / totalFramesCount) * 100;
                              const isSelectedKeyframe = editingKeyframe?.layerId === layer.id && editingKeyframe?.index === index;

                              // Keyframe Drag Handlers (Copied back from previous state/history)
                              const handleKeyframeDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
                                if (e.button !== 0) return; // Only handle left mouse button
                                e.stopPropagation();
                                const target = e.currentTarget;
                                target.style.opacity = '0.5';
                                
                                const startX = e.clientX;
                                const startFrame = kf.frame;
                                let lastFrame = startFrame;
                                let isDragging = false;
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  moveEvent.preventDefault();
                                  isDragging = true;
                                  const deltaX = moveEvent.clientX - startX;
                                  const timelineWidth = timelineAreaRef.current?.clientWidth || 1; // Use timelineAreaRef width
                                  const frameDelta = Math.round((deltaX / timelineWidth) * totalFramesCount);
                                  const newFrame = Math.max(0, Math.min(totalFramesCount - 1, startFrame + frameDelta));
                                  
                                  if (newFrame !== lastFrame) {
                                    lastFrame = newFrame;
                                    onUpdateKeyframeFrame(layer.id, index, newFrame);
                                  }
                                };
                                
                                const handleMouseUp = () => {
                                  target.style.opacity = '1';
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                  
                                  target.dataset.wasDragged = isDragging.toString();
                                  setTimeout(() => {
                                    delete target.dataset.wasDragged;
                                  }, 0);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              };

                              // --- Determine Keyframe Color ---
                              const keyframeSpanColorClass = animationSpanColors[index % animationSpanColors.length]; // Color of the span *after* this keyframe
                              
                              // Muted background based on span color, slightly more opaque
                              const keyframeBgClass = keyframeSpanColorClass
                                .replace(/\/5(?=\s|$)|\/5$/, '/15') // Increase opacity from /5 to /15
                                .replace(/\/10(?=\s|$)|\/10$/, '/25'); // Increase opacity from /10 to /25

                              // Very strong, high-contrast border (independent of span color)
                              const keyframeBorderClass = `border-l-cyan-600 dark:border-l-neutral-100 bg-cyan-300/10 dark:bg-cyan-300/10`;

                              return (
                                <ContextMenu key={`kf-${layer.id}-${index}`}>
                                  <Tooltip>
                                    <ContextMenuTrigger asChild>
                                      <TooltipTrigger asChild>
                                        <div
                                          data-keyframe="true"
                                          onMouseDown={handleKeyframeDragStart}
                                          className={`absolute top-0 bottom-0 cursor-ew-resize select-none transition-colors z-10 border-l-4 ${
                                            selectedKeyframes.some(k => k.layerId === layer.id && k.index === index)
                                            ? 'bg-amber-400/40 dark:bg-amber-400/30 border-l-amber-500 dark:border-l-amber-400 hover:bg-amber-400/60'
                                            : isSelectedKeyframe
                                            ? 'bg-red-500/40 dark:bg-red-500/30 border-l-red-700 dark:border-l-red-400 hover:bg-red-500/60 dark:hover:bg-red-500/40'
                                            : `${keyframeBgClass} ${keyframeBorderClass} hover:opacity-80`
                                          }`}
                                          style={{ left: `${framePosition}%`, width: `${frameWidthPercent}%` }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (e.currentTarget.dataset.wasDragged === 'true') return;
                                            if (e.shiftKey) {
                                              setSelectedKeyframes(prev => {
                                                const exists = prev.some(k => k.layerId === layer.id && k.index === index);
                                                return exists
                                                  ? prev.filter(k => !(k.layerId === layer.id && k.index === index))
                                                  : [...prev, { layerId: layer.id, index }];
                                              });
                                            } else {
                                              setSelectedKeyframes([]);
                                              handleKeyframeClick(layer.id, index);
                                            }
                                          }}
                                        />
                                      </TooltipTrigger>
                                    </ContextMenuTrigger>
                                    <TooltipContent><p>Frame: {kf.frame} — right-click for options</p></TooltipContent>
                                  </Tooltip>
                                  <ContextMenuContent>
                                    <ContextMenuItem onClick={() => setKeyframeClipboard({ ...kf })}>
                                      Copy keyframe
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                      disabled={!keyframeClipboard}
                                      onClick={() => {
                                        if (!keyframeClipboard) return;
                                        const { frame, ...values } = keyframeClipboard;
                                        void frame;
                                        onPasteKeyframe(layer.id, currentFrame, values);
                                      }}
                                    >
                                      Paste at playhead {keyframeClipboard ? `(frame ${currentFrame})` : ''}
                                    </ContextMenuItem>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem
                                      className="text-destructive"
                                      onClick={() => { setKeyframeToDelete({ layerId: layer.id, index }); setIsDeleteKeyframeDialogOpen(true); }}
                                    >
                                      Delete keyframe
                                    </ContextMenuItem>
                                    {selectedKeyframes.length > 1 && (
                                      <>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem onClick={() => {
                                          const delta = 0; // no-op placeholder — actual nudge via arrow keys
                                          void delta;
                                          // Show hint
                                        }} disabled>
                                          {selectedKeyframes.length} keyframes selected — use ←/→ to nudge
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            // Delete all selected keyframes (in reverse index order per layer to avoid index shift)
                                            const byLayer = selectedKeyframes.reduce((acc, k) => {
                                              (acc[k.layerId] = acc[k.layerId] || []).push(k.index);
                                              return acc;
                                            }, {} as Record<string, number[]>);
                                            Object.entries(byLayer).forEach(([layerId, indices]) => {
                                              [...indices].sort((a, b) => b - a).forEach(idx => onDeleteKeyframe(layerId, idx));
                                            });
                                            setSelectedKeyframes([]);
                                          }}
                                        >
                                          Delete {selectedKeyframes.length} selected keyframes
                                        </ContextMenuItem>
                                      </>
                                    )}
                                  </ContextMenuContent>
                                </ContextMenu>
                              );
                            })}
                          </div>
                        )}

                        {/* Loop return region band */}
                        {layerAnimation?.loop && (() => {
                          const sorted = [...layerAnimation.keyframes].sort((a, b) => a.frame - b.frame);
                          if (sorted.length === 0) return null;
                          const lastKfFrame = sorted[sorted.length - 1].frame;
                          if (lastKfFrame >= totalFramesCount - 1) return null;
                          const leftPct = (lastKfFrame / totalFramesCount) * 100;
                          const widthPct = ((totalFramesCount - lastKfFrame) / totalFramesCount) * 100;
                          return (
                            <div
                              className="absolute top-0 bottom-0 pointer-events-none flex items-center"
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              title="Loop return region"
                            >
                              <div className="absolute inset-0 bg-blue-400/10 border-l-2 border-l-blue-400/50" />
                              <Repeat className="relative ml-1 h-3 w-3 text-blue-400/60 shrink-0" />
                            </div>
                          );
                        })()}

                        {/* Animation Span Indicators */}
                        {layerAnimation && layerAnimation.keyframes.length > 1 && (
                          <div className="absolute inset-0 z-0"> {/* Container for spans, behind keyframes (z-10) */} 
                            {layerAnimation.keyframes.slice(0, -1).map((kf, index) => {
                              const nextKf = layerAnimation.keyframes[index + 1];
                              const startFrame = kf.frame;
                              const endFrame = nextKf.frame;
                              if (startFrame >= endFrame) return null; // Skip if frames are out of order or same

                              const leftPercent = (startFrame / totalFramesCount) * 100;
                              const spanWidthPercent = ((endFrame - startFrame) / totalFramesCount) * 100;

                              // --- Select color cyclically from the palette ---
                              const colorClass = animationSpanColors[index % animationSpanColors.length];

                              return (
                                <div 
                                  key={`span-${layer.id}-${index}`}
                                  className={`absolute top-0 bottom-0 pointer-events-none ${colorClass}`} // Apply dynamic color
                                  style={{
                                    left: `${leftPercent}%`,
                                    width: `${spanWidthPercent}%`,
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div> {/* End Layer Timeline Area */}
                    </div>
                  );
                })}

              {/* --- Bottom Drop Zone --- */}
              <div 
                className={`h-1 border-b border-border transition-colors ${dragOverId === '__BOTTOM__' ? 'border-t-2 border-t-destructive' : ''}`}
                onDragOver={(e) => handleDragOver(e, '__BOTTOM__')} // Use special ID or null
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)} // Pass null targetId for bottom drop
              >
                 {/* Optional: Can add a subtle visual cue like faint text */} 
              </div>

            </div> {/* End Layers Scroll Container */} 
         </div> {/* End Inner container */} 
      </div> {/* End Timeline Grid Container */} 

      {/* Zoom & Pan Toolbar */} 
      <div className="flex items-center gap-4 p-2 border-t border-border bg-secondary/30"> {/* Increased gap */} 
        {/* Zoom Controls */} 
        <div className="flex items-center gap-2">
           <ZoomOut className="h-4 w-4 text-muted-foreground" />
           <Slider 
             min={1} max={10} step={0.5} value={[zoomLevel]}
             onValueChange={(value) => setZoomLevel(value[0])}
             className="w-32"
           />
           <ZoomIn className="h-4 w-4 text-muted-foreground" />
           <span className="text-xs text-muted-foreground">({(zoomLevel * 100).toFixed(0)}%)</span>
        </div>

        {/* Minimap/Pan Control */} 
        <div 
           ref={minimapTrackRef} 
           className="flex-1 h-5 bg-muted rounded relative overflow-hidden cursor-pointer"
           onClick={handleMinimapTrackClick} // Add click handler to track
        >
           {/* Keyframe Markers */} 
           {allKeyframeMarkers.map(marker => {
              const leftPercent = (marker.frame / totalFramesCount) * 100;
              // Ensure percentage stays within bounds (shouldn't be necessary if frames are clamped)
              if (leftPercent < 0 || leftPercent > 100) return null; 
              return (
                 <div 
                   key={`${marker.frame}-${marker.isSelectedLayer}`} // Key needs to be unique
                   className={`absolute top-0 bottom-0 w-px ${marker.isSelectedLayer ? 'bg-red-500' : 'bg-foreground/30'}`}
                   style={{ left: `${leftPercent}%` }}
                   title={`Keyframe at Frame ${marker.frame}`}
                 />
              );
            })}

           {/* Minimap Thumb */} 
           <div 
             ref={minimapThumbRef} 
             className="absolute h-full bg-primary/40 border border-primary/80 rounded cursor-grab active:cursor-grabbing z-10"
             style={{ left: '0px', width: '50px' }} 
             onMouseDown={handleMinimapPanStart}
           />
        </div>
      </div>

      {/* Row-level context menu for pasting keyframes on empty timeline space */}
      {rowContextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setRowContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setRowContextMenu(null); }}
        >
          <div
            className="absolute rounded-md border bg-popover p-1 text-popover-foreground shadow-md min-w-[160px]"
            style={{ left: rowContextMenu.x, top: rowContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-default"
              onClick={() => {
                onAddKeyframeAtFrame(rowContextMenu.layerId, currentFrame);
                setRowContextMenu(null);
              }}
            >
              Add keyframe at frame {currentFrame}
            </button>
            <button
              className={`relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ${
                keyframeClipboard
                  ? 'hover:bg-accent hover:text-accent-foreground cursor-default'
                  : 'text-muted-foreground cursor-not-allowed'
              }`}
              disabled={!keyframeClipboard}
              onClick={() => {
                if (!keyframeClipboard) return;
                const { frame, ...values } = keyframeClipboard;
                void frame;
                onPasteKeyframe(rowContextMenu.layerId, currentFrame, values);
                setRowContextMenu(null);
              }}
            >
              Paste keyframe {keyframeClipboard ? `at frame ${currentFrame}` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Keyframe Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteKeyframeDialogOpen} onOpenChange={setIsDeleteKeyframeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keyframe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this keyframe? This action cannot be undone. 
              {/* Optional: Add details about the keyframe? */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setKeyframeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteKeyframe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div> /* End Main Div */
  );
};

export default TimelineSection;
