import Konva from 'konva';
// Layer Types
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export type LayerType = 'color' | 'gradient' | 'image' | 'text' | 'group' | 'mask';

// Base interface for all layer types
export interface BaseLayerData {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  blendMode?: BlendMode;
  maskId?: string;
  parentId?: string;
  locked?: boolean;
  src?: string;
  fill?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface ColorLayerData extends BaseLayerData {
  type: 'color';
  fill: string;
}

export interface GradientLayerData extends BaseLayerData {
  type: 'gradient';
  gradient: {
    type: 'linear' | 'radial';
    stops: Array<{
      color: string;
      position: number; // 0 to 1
    }>;
    // Linear specific
    start?: { x: number; y: number }; // 0 to 1 relative to layer bounds
    end?: { x: number; y: number };   // 0 to 1 relative to layer bounds
    // Radial specific
    center?: { x: number; y: number }; // 0 to 1 relative to layer bounds
    radius?: number; // Radius relative to layer size (e.g., 0.5 for half the smallest dimension)
    angle?: number; // Retained for potential future use or if needed for radial? Konva linear uses start/end points.
  };
}

export interface ImageLayerData extends BaseLayerData {
  type: 'image';
  src: string;
  fit: 'contain' | 'cover' | 'fill' | 'none';
  rotation: number;
  smartObject?: boolean;
  originalSize?: { width: number; height: number };
}

export interface TextLayerData extends BaseLayerData {
  type: 'text';
  content: string;
  font: {
    family: string;
    size: number;
    weight: number;
    style: 'normal' | 'italic';
    letterSpacing: number;
    lineHeight: number;
  };
  fill: string;
  alignment: 'left' | 'center' | 'right';
  rotation: number;
  effects?: TextEffects;
}

export interface GroupLayerData extends BaseLayerData {
  type: 'group';
  children: LayerData[];
  isExpanded?: boolean;
}

export interface MaskLayerData extends BaseLayerData {
  type: 'mask';
  maskType: 'alpha' | 'luminance' | 'vector';
  inverted: boolean;
  featherAmount: number;
}

export type LayerData = ColorLayerData | GradientLayerData | ImageLayerData | TextLayerData | GroupLayerData | MaskLayerData;

// Effects and Styles
export interface TextEffects {
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  stroke?: {
    color: string;
    width: number;
    opacity: number;
  };
}

// Animation Types
export interface KeyframeAction {
  type: 'gotoAndPlay' | 'gotoAndStop' | 'loop' | 'pause';
  targetKeyframe: string;
  loopCount?: number;
}

export interface Keyframe {
  frame: number;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  color?: string;
  fontSize?: number;
  letterSpacing?: number;
  easing?: string;
  bezierPoints?: number[]; // Custom bezier curve points [x1, y1, x2, y2]
  scaleX?: number;
  scaleY?: number;
  action?: KeyframeAction; // Optional action at this keyframe
}

export interface AnimationData {
  layerId: string;
  loop: boolean;
  keyframes: Keyframe[];
  loopStartFrame?: number;
  loopEndFrame?: number;
}

// Timeline Types
export interface TimelineState {
  currentFrame: number;
  isPlaying: boolean;
  totalFrames: number;
  fps: number;
  animations: AnimationData[];
}

export type TimelineSetState = React.Dispatch<React.SetStateAction<number>>;

export interface TimelineMarker {
  frame: number;
  name: string;
  color: string;
}

// Stage Types
export interface StageSize {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

// Project Types
export interface AnimationScene {
  id: string; // Unique ID for the scene
  name: string; // e.g., "300x250 Banner", "728x90 Leaderboard"
  layers: LayerData[];
  animations: AnimationData[];
  stageSize: StageSize;
  totalDuration: number;
  fps: number;
  currentFrame: number;
  isPlaying: boolean;
  hasUnsavedChanges?: boolean;
}

export interface ProjectData {
  scenes: AnimationScene[];
}

// Cache Types
export interface ImageCache {
  [key: string]: HTMLImageElement;
}

export interface FontCache {
  [key: string]: FontFace;
}

// Reference Types
export interface AnimationFrameRef {
  current: number | null;
}

export interface LastFrameTimeRef {
  current: number;
}

// Callback Types
export type FrameUpdateCallback = (frame: number) => void;
export type PlayStateCallback = (isPlaying: boolean) => void;
export type LayerUpdateCallback = (layers: LayerData[]) => void;

// Update LayerProperty to include all possible properties
export type LayerProperty = keyof BaseLayerData | 
  'gradient' | 'content' | 'alignment' | 'rotation' | 'font' | 
  'effects' | 'children' | 'maskType' | 'inverted' | 'featherAmount' |
  'fit' | 'smartObject' | 'originalSize' | 'fontSize' | 'fontFamily' | 
  'fontWeight' | 'fontStyle' | 'letterSpacing' | 'lineHeight' |
  'color' | 'fill' | 'content' | 'stops' | 'angle' | 'center' |
  'easing' |
  // Gradient specific properties (access via gradient object)
  'gradient.type' | 'gradient.stops' | 'gradient.start' | 'gradient.end' |
  'gradient.center' | 'gradient.radius' | 'gradient.angle';

// Define a union of possible value types for layer properties
export type LayerPropertyValue = 
  string | 
  number | 
  boolean | 
  TextLayerData['font'] |
  GradientLayerData['gradient'] | 
  TextLayerData['effects'] | 
  LayerData[] | // For group children
  null | undefined; // Allow null/undefined for optional properties?

export type PropertyUpdateCallback = (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;

// Component Props Types
export interface CanvasAreaProps {
  layers: LayerData[];
  animations: AnimationData[];
  currentFrame: number;
  totalFrames: number;
  stageSize: StageSize;
  selectedLayerId: string | null;
  images: ImageCache;
  stageRef: React.RefObject<Konva.Stage | null>;
  editingKeyframe: { layerId: string; index: number } | null;
  onLayerSelect: (layerId: string) => void;
  onDragEnd: (layerId: string, x: number, y: number) => void;
  onStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onLayerTransformEnd: (layerId: string, props: Partial<LayerData>) => void;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
}

export interface TimelineSectionProps {
  layers: LayerData[];
  animations: AnimationData[];
  selectedLayerId: string | null;
  editingKeyframe: { layerId: string; index: number } | null;
  fps: number;
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  isRenaming: string | null;
  onSetCurrentFrame: (frame: number) => void;
  onTogglePlay: () => void;
  onStopAnimation: () => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onAddKeyframe: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onSetEditingKeyframe: (data: { layerId: string; index: number } | null) => void;
  onUpdateKeyframeFrame: (layerId: string, index: number, newFrame: number) => void;
  onTimelineMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPlayheadMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSetIsRenaming: (layerId: string | null) => void;
  onUpdateLayerName: (layerId: string, name: string) => void;
  onReorderLayers: (draggedId: string, targetId: string | null) => void;
  onDeleteKeyframe: (layerId: string, index: number) => void;
  onPasteKeyframe: (layerId: string, frame: number, values: Omit<Keyframe, 'frame'>) => void;
  onBulkMoveKeyframes: (moves: { layerId: string; index: number; toFrame: number }[]) => void;
  onToggleLayerLoop: (layerId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
  onToggleGroupExpansion: (groupId: string) => void;
  onToggleGroupLoop: (groupId: string) => void;
  timelineHeaderRef: React.RefObject<HTMLDivElement | null>;
  timelineAreaRef: React.RefObject<HTMLDivElement | null>;
  groupLoopStates: Map<string, { hasAnimations: boolean; isLooping: boolean }>;
  onAddNewLayer: (type: LayerType) => void;
  onShowLayersDebug: () => void;
  onCopyLayer: (layerId: string) => void;
  onPasteLayer: () => void;
  onPasteLayerToAllScenes: () => void;
  hasLayerClipboard: boolean;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
}

export interface PropertiesPanelProps {
  selectedLayer: LayerData | null;
  stageSize: { width: number; height: number };
  totalDuration: number;
  fps: number;
  animations: AnimationData[];
  currentFrame: number;
  selectedKeyframe: { layerId: string; index: number } | null;
  editingKeyframe: { layerId: string; index: number } | null;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
  onSetStageSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  onSetTotalDuration: React.Dispatch<React.SetStateAction<number>>;
  onSetFps: React.Dispatch<React.SetStateAction<number>>;
  onTemplateSelect: (templateSize: string) => void;
  onSetKeyframeProperty: (layerId: string, property: LayerProperty, value: number | string) => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteKeyframe: (layerId: string, index: number) => void;
  onSetGlobalLoop: (loop: boolean) => void;
  onUpdateKeyframe: (layerId: string, keyframeIndex: number, updates: Partial<Keyframe>) => void;
  onToggleLayerLoop: (layerId: string) => void;
  onToggleGroupLoop: (groupId: string) => void;
  onToggleGroupExpansion: (groupId: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  scenes?: AnimationScene[];
  onUseAsset?: (src: string) => void;
  onSaveAsTemplate?: () => void;
}

export interface TopBarProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNewLayer: (type: LayerType) => void;
  onExport: () => void;
  exporting: boolean;
  isBatchExporting?: boolean;
  uploadError: string | null;
  currentProjectData: ProjectData;
  canSaveNow: boolean;
  loadedProjectName: string | null;
  onLoadProjectData: (data: ProjectData, projectName: string) => void;
  onSaveProject: (projectName: string) => Promise<boolean>;
  onBatchExport?: () => void;
  sceneCount?: number;
}

// Layer Transform Types
export interface LayerTransformProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

// File Operation Types
export interface FileParseResult {
  layers: LayerData[];
  error?: string;
  svgSize?: { width: number; height: number };
}

// Smart Guides Types
export interface SnapThreshold {
  position: number;
  rotation: number;
  sizing: number;
}

export interface GuideLines {
  vertical: number[];
  horizontal: number[];
}

export interface SnapResult {
  x: number;
  y: number;
  guides: GuideLines;
}

export interface LayerBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

// History Types
export interface HistoryState {
  layers: LayerData[];
  animations: AnimationData[];
  selectedLayerId: string | null;
}

// Redefine HistoryAction as a Discriminated Union
export type HistoryAction =
  | { type: 'ADD_LAYER'; payload: { layer: LayerData }; timestamp: number }
  | { type: 'DELETE_LAYER'; payload: { layerId: string }; timestamp: number }
  | { type: 'MODIFY_LAYER'; payload: { layerId: string; changes: Partial<LayerData> }; timestamp: number }
  | { type: 'MODIFY_ANIMATION'; payload: { layerId: string; changes: Partial<AnimationData> }; timestamp: number }
  | { type: 'REORDER_LAYERS'; payload: { layerId: string; oldIndex: number; newIndex: number }; timestamp: number };

// Export Types
export type ExportTarget = 'generic' | 'gdn' | 'dv360' | 'ttd';

export interface ExportConfig {
  layers: LayerData[];
  animations: AnimationData[];
  fps: number;
  totalFrames: number;
  stageSize: {
    width: number;
    height: number;
  };
  target?: ExportTarget;
  filename?: string;
}

// Animation State Types
export interface AnimationState {
  currentFrame: number;
  isPlaying: boolean;
  fps: number;
  totalFrames: number;
}

// Add missing types from utils
export interface TemplateData {
  layers: LayerData[];
  animations: AnimationData[];
  stageSize: StageSize;
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export interface TemplateModule {
  default: TemplateData;
}

// Worker Types
export type WorkerMessagePayload = {
  EXPORT: {
    layers: LayerData[];
    animations: AnimationData[];
    width: number;
    height: number;
  };
  OPTIMIZE: {
    layers: LayerData[];
    animations: AnimationData[];
  };
  ANALYZE: {
    layers: LayerData[];
    animations: AnimationData[];
  };
};

export interface WorkerMessage {
  type: keyof WorkerMessagePayload;
  payload: WorkerMessagePayload[keyof WorkerMessagePayload];
}

export interface WorkerResponse {
  type: 'EXPORT_COMPLETE' | 'OPTIMIZE_COMPLETE' | 'ANALYZE_COMPLETE' | 'ERROR';
  payload: Blob | {
    layers: LayerData[];
    animations: AnimationData[];
  } | {
    totalLayers: number;
    imageCount: number;
    animationCount: number;
    totalKeyframes: number;
    recommendations: string[];
  } | null;
  error?: string;
}

// +++ Project Management Hook Types +++
export interface ProjectManagementHookArgs {
  scenes: AnimationScene[];
  setScenes: React.Dispatch<React.SetStateAction<AnimationScene[]>>;
  setActiveSceneId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedLayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingKeyframe: React.Dispatch<React.SetStateAction<{ layerId: string; index: number } | null>>;
}

export interface UseProjectManagementReturn {
  loadedProjectName: string | null;
  setLoadedProjectName: React.Dispatch<React.SetStateAction<string | null>>;
  saveProject: (projectName: string) => Promise<boolean>;
  loadProject: (projectData: ProjectData, projectName: string, projectId?: string) => void;
  isImageLayer: (layer: LayerData) => layer is ImageLayerData; // Keep helper within hook? Or move to utils? Let's include for now.
  isLocalSrc: (src: string) => boolean; // Keep helper within hook? Or move to utils? Let's include for now.
}

// +++ Timeline Controls Hook Types +++
export interface TimelineControlsHookArgs {
  activeSceneId: string;
  activeTotalFrames: number;
  activeFps: number;
  activeAnimations: AnimationData[];
  activeLayers: LayerData[]; // Needed for creating keyframes from base state
  activeCurrentFrame: number; // NEW: Current frame of the active scene
  activeIsPlaying: boolean; // NEW: Play state of the active scene
  updateSceneState: (sceneId: string, updates: Partial<Pick<AnimationScene, 'currentFrame' | 'isPlaying'>>) => void; // NEW: Callback to update scene state
  timelineAreaRef: React.RefObject<HTMLDivElement | null>;
  setScenes: React.Dispatch<React.SetStateAction<AnimationScene[]>>; // Keep for other updates
  markUnsavedChanges: (sceneId: string) => void;
  setEditingKeyframe: React.Dispatch<React.SetStateAction<{ layerId: string; index: number } | null>>; // Pass setter
}

export interface UseTimelineControlsReturn {
  // Remove internal state setters if they are no longer managed here
  // currentFrame: number; // No longer managed internally
  // setCurrentFrame: React.Dispatch<React.SetStateAction<number>>; // No longer managed internally
  // isPlaying: boolean; // No longer managed internally
  // setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>; // No longer managed internally

  // Keyframe/Timeline Interaction Handlers
  handleAddKeyframeForLayer: (layerId: string) => void;
  handleDeleteKeyframe: (layerId: string, index: number) => void;
  handleUpdateKeyframeFrame: (layerId: string, index: number, newFrame: number) => void;
  handleBulkMoveKeyframes: (moves: { layerId: string; index: number; toFrame: number }[]) => void;
  handleTimelineMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handlePlayheadMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSetKeyframeProperty: (layerId: string, property: LayerProperty, value: number | string) => void; // Keyframe setting
  // Playback Controls
  togglePlay: () => void;
  stopAnimation: () => void;
  // Keyboard shortcut handlers (e.g., for frame stepping)
  prevFrameKeyHandlers: { onMouseDown: () => void };
  nextFrameKeyHandlers: { onMouseDown: () => void };
  // Animation loop runner (might belong here or in App? Let's try putting it here)
  runAnimationLoop: () => void;
}

export type PendingKeyframeMarker = { layerId: string; frame: number } | null; 