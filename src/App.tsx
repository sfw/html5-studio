import React, { useState, useRef, useMemo, useCallback } from 'react'
import Konva from 'konva'
import { TooltipProvider } from '@/components/ui/tooltip'
import PropertiesPanel from './components/PropertiesPanel'
import TimelineSection from './components/TimelineSection'
import TopBar from './components/TopBar'
import CanvasArea from './components/CanvasArea'
import ExportProgressModal from './components/ExportProgressModal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import SceneTabs from './components/SceneTabs' // +++ Import SceneTabs +++
import TemplateSelectorDialog from './components/TemplateSelectorDialog'; // +++ Import Template Dialog
import ImportSvgOptionsDialog from './components/ImportSvgOptionsDialog'; // +++ Import SVG Options Dialog
import LayersDebugModal from './components/LayersDebugModal'; // +++ Import Debug Modal +++
import ExportPreviewModal from './components/ExportPreviewModal';

// Import types from the new consolidated types file
import {
  AnimationData,
  AnimationScene,
  PendingKeyframeMarker,
} from '@/types/index'
import { demoProject, demoProjectDefaultSceneId } from '@/data/demoProject'




import { useProjectManagement } from './hooks/useProjectManagement'; // +++ Import the new hook
import { useTimelineControls } from './hooks/useTimelineControls'; // +++ Import the new hook
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'; // +++ Import the keyboard hook
import { useHistory } from './hooks/useHistory';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { useShortcutsHelpTrigger } from './components/useShortcutsHelpTrigger';
import { useCanvasControls } from './hooks/useCanvasControls';
import { useImageLoader } from './hooks/useImageLoader';
import { useExportControls } from './hooks/useExportControls';
import { useSvgImport } from './hooks/useSvgImport';
import { useSceneManagement } from './hooks/useSceneManagement';
import { useLayerOperations } from './hooks/useLayerOperations';
import { CanvasToolbar } from './components/CanvasToolbar';

const AppWithLogging = () => {
  // --- NEW State Structure for Multiple Scenes ---
  const {
    state: scenes,
    set: setScenes,
    setQuiet: setScenesQuiet,
    undo: undoHistory,
    redo: redoHistory,
    canUndo,
    canRedo,
    clear: clearHistory,
  } = useHistory<AnimationScene[]>(
    demoProject.scenes.map(scene => ({
      ...scene,
      stageSize: { ...scene.stageSize, devicePixelRatio: window.devicePixelRatio },
    }))
  );
  const [activeSceneId, setActiveSceneId] = useState<string>(demoProjectDefaultSceneId);

  // +++ Find the active scene object +++
  const activeScene = useMemo(() => {
    const scene = scenes.find(s => s.id === activeSceneId);
    if (!scene) {
      console.error(`Active scene with ID ${activeSceneId} not found! Falling back to first scene.`);
      // Ensure fallback has the new properties too
      return { ...scenes[0], currentFrame: scenes[0].currentFrame ?? 0, isPlaying: scenes[0].isPlaying ?? false };
    }
    // Ensure active scene has the properties (might be needed if loading old data)
    return { ...scene, currentFrame: scene.currentFrame ?? 0, isPlaying: scene.isPlaying ?? false };
  }, [scenes, activeSceneId]);

  // +++ Derive properties from the active scene +++
  const { 
    layers: activeLayers, 
    animations: activeAnimations, 
    stageSize: activeStageSize, 
    totalDuration: activeTotalDuration, 
    fps: activeFps, 
    currentFrame: activeCurrentFrame, // Use active scene's frame
    isPlaying: activeIsPlaying // Use active scene's playing state
  } = activeScene;

  const activeTotalFrames = useMemo(() => {
    return Math.max(1, Math.floor(activeTotalDuration * activeFps));
  }, [activeTotalDuration, activeFps]);

  // --- State NOT managed by timeline hook ---
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editingKeyframe, setEditingKeyframe] = useState<{ layerId: string, index: number } | null>(null);
  const [activePropertiesTab, setActivePropertiesTab] = useState('layer');
  const stageRef = useRef<Konva.Stage>(null)
  const images = useImageLoader(scenes);
  const [isRenaming, setIsRenaming] = useState<string | null>(null)
  const timelineHeaderRef = useRef<HTMLDivElement>(null)
  const timelineAreaRef = useRef<HTMLDivElement>(null) // Ref passed to hook
  const [isLayersDebugModalOpen, setIsLayersDebugModalOpen] = useState(false); // +++ State for Debug Modal +++
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const canvasControls = useCanvasControls();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [pendingKeyframeMarker, setPendingKeyframeMarker] = useState<PendingKeyframeMarker>(null); // +++ Lifted state

  // --- Calculate Group Loop States --- 
  const groupLoopStates = useMemo(() => {
    const states = new Map<string, { hasAnimations: boolean; isLooping: boolean }>();
    const animationMap = new Map<string, AnimationData>(activeAnimations.map(a => [a.layerId, a])); // Use activeAnimations

    // Helper to recursively get all descendant IDs
    const getDescendantIds = (parentId: string): string[] => {
      const children = activeLayers.filter(l => l.parentId === parentId);
      let descendantIds: string[] = children.map(c => c.id);
      children.forEach(child => {
        if (child.type === 'group') {
          descendantIds = descendantIds.concat(getDescendantIds(child.id));
        }
      });
      return descendantIds;
    };

    activeLayers.forEach(layer => { // Use activeLayers
      if (layer.type === 'group') {
        const descendantIds = getDescendantIds(layer.id);
        let hasAnimations = false;
        let isLooping = true; // Assume true until proven otherwise
        let foundAnimatableChild = false;

        descendantIds.forEach(descendantId => {
          const anim = animationMap.get(descendantId);
          if (anim && anim.keyframes.length > 0) {
            hasAnimations = true; // Found at least one animation
            foundAnimatableChild = true;
            if (!anim.loop) {
              isLooping = false; // Found an animatable child that is not looping
            }
          }
        });

        // If no animatable children were found, the group itself isn't considered looping
        if (!foundAnimatableChild) {
            isLooping = false; 
        }

        states.set(layer.id, { hasAnimations, isLooping });
      }
    });

    return states;
  }, [activeLayers, activeAnimations]); // Depend on activeLayers, activeAnimations

  // +++ Moved useMemo for TopBar data to top level +++
  const currentProjectDataForTopBar = useMemo(() => ({
    hasDataToSave: scenes.length > 0 && scenes.some(s => s.hasUnsavedChanges),
  }), [scenes]);

  // --- NEW: Function to update a specific scene's state ---
  const updateSceneState = useCallback((sceneId: string, updates: Partial<Pick<AnimationScene, 'currentFrame' | 'isPlaying'>>) => {
    setScenesQuiet(currentScenes =>
      currentScenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
    );
    // Note: Updating frame/play state shouldn't mark as unsaved or push to history
  }, [setScenesQuiet]);

  // --- Callback for marking changes --- 
  const markUnsavedChanges = useCallback((sceneIdToMark: string) => {
    setScenesQuiet(currentScenes =>
      currentScenes.map(scene => {
        // Only mark if it's the target scene AND not already marked
        if (scene.id === sceneIdToMark && !scene.hasUnsavedChanges) {
          console.log(`Marking unsaved changes for scene: ${scene.name} (${sceneIdToMark})`);
          return { ...scene, hasUnsavedChanges: true };
        }
        return scene; // Return unchanged scene otherwise
      })
    );
    // NO global state setting anymore
  }, [setScenesQuiet]);

  // +++ Call the Project Management Hook +++
  const {
    loadedProjectName,
    saveProject: saveProjectFromHook,
    loadProject: loadProjectFromHook,
  } = useProjectManagement({
    scenes,
    setScenes,
    setActiveSceneId,
    setSelectedLayerId,
    setEditingKeyframe,
  });

  // +++ Modify Call to the Timeline Controls Hook +++ 
  const {
    handleAddKeyframeForLayer,
    handleDeleteKeyframe,
    handleUpdateKeyframeFrame,
    handleBulkMoveKeyframes,
    handleTimelineMouseDown,
    handlePlayheadMouseDown,
    handleSetKeyframeProperty,
    togglePlay, // Will need modification inside the hook
    stopAnimation, // Will need modification inside the hook
    prevFrameKeyHandlers,
    nextFrameKeyHandlers,
  } = useTimelineControls({
    activeSceneId,
    activeTotalFrames, // Correctly pass this prop
    activeFps,         // Keep passing derived values
    activeAnimations,  // Keep passing derived values
    activeLayers,      // Keep passing derived values
    activeCurrentFrame, // Pass the active scene's current frame
    activeIsPlaying, // Pass the active scene's playing state
    updateSceneState, // Pass the new state update function
    timelineAreaRef, 
    setScenes, // Still needed for animation/layer updates
    setEditingKeyframe,
  });

  // --- Export controls ---
  const {
    exporting,
    isBatchExporting,
    isExportPreviewOpen,
    isExportProgressOpen,
    exportIsComplete,
    exportLog,
    exportTarget,
    exportFilename,
    setExportTarget,
    setExportFilename,
    setIsExportPreviewOpen,
    setIsExportProgressOpen,
    exportHTML5Package,
    handleBatchExport,
  } = useExportControls({
    activeScene: {
      layers: activeLayers,
      animations: activeAnimations,
      fps: activeFps,
      totalFrames: activeTotalFrames,
      stageSize: activeStageSize,
    },
    scenes,
  });

  // --- SVG import ---
  const {
    uploadError,
    isSvgImportOptionsOpen,
    setIsSvgImportOptionsOpen,
    handleFileUpload,
    handleSvgImportOptionSelected,
  } = useSvgImport({ activeSceneId, setScenes, setActiveSceneId, markUnsavedChanges });

  // --- Layer operations ---
  const {
    hasLayerClipboard,
    updateLayerProperty,
    handleDragEnd,
    handleLayerTransformEnd,
    toggleLayerVisibility,
    handleLayerSelect,
    handleReorderLayers,
    addNewLayer,
    handleUpdateKeyframe,
    handleUpdateLayerName,
    handleDeleteLayer,
    handleSetEditingKeyframe,
    handleSetStageSize,
    handleSetTotalDuration,
    handleSetFps,
    handleSetGlobalLoop,
    handleToggleLayerLoop,
    handleToggleGroupExpansion,
    handleToggleGroupLoop,
    handleAddKeyframeAtFrame,
    handlePasteKeyframe,
    handleCopyLayer,
    handlePasteLayer,
    handlePasteLayerToAllScenes,
    handleDuplicateLayer,
    handleToggleLayerLock,
  } = useLayerOperations({
    activeSceneId,
    activeLayers,
    scenes,
    setScenes,
    markUnsavedChanges,
    selectedLayerId,
    setSelectedLayerId,
    setEditingKeyframe,
    setActivePropertiesTab,
    handleSetKeyframeProperty,
    setPendingKeyframeMarker,
  });

  // --- Scene management ---
  const {
    isTemplateSelectorOpen,
    setIsTemplateSelectorOpen,
    isTemplateConfirmOpen,
    setIsTemplateConfirmOpen,
    templateToLoad,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    sceneToDeleteId,
    handleTemplateSelect,
    handleInitiateAddScene,
    handleTemplateSelected,
    handleCreateCustomScene,
    handleLoadCustomTemplate,
    handleSaveAsTemplate,
    handleUseAsset,
    handleRenameScene,
    handleInitiateDeleteScene,
    handleConfirmDeleteScene,
    handleReorderScenes,
    loadTemplateAndReset,
  } = useSceneManagement({
    scenes,
    activeSceneId,
    setScenes,
    setActiveSceneId,
    markUnsavedChanges,
    updateSceneState,
    setSelectedLayerId,
    updateLayerProperty,
    selectedLayerId,
  });

  // Derived selected layer
  const selectedLayer = useMemo(() => activeLayers.find(l => l.id === selectedLayerId) || null, [activeLayers, selectedLayerId]);

  // --- Keyboard Shortcuts Help ---
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  useShortcutsHelpTrigger(() => setIsShortcutsHelpOpen(true));

  // --- Wrap load to also clear history ---
  const handleLoadProject = useCallback((projectData: Parameters<typeof loadProjectFromHook>[0], projectName: string, projectId?: string) => {
    loadProjectFromHook(projectData, projectName, projectId);
    clearHistory();
  }, [loadProjectFromHook, clearHistory]);

  // --- Undo / Redo ---
  const handleUndo = useCallback(() => {
    undoHistory();
  }, [undoHistory]);

  const handleRedo = useCallback(() => {
    redoHistory();
  }, [redoHistory]);

  // --- Call Keyboard Shortcut Hook ---
  useKeyboardShortcuts({
    togglePlay,
    updateSceneState, // Added
    activeSceneId, // Added
    activeCurrentFrame, // Added
    activeTotalFrames,
    prevFrameKeyHandlers,
    nextFrameKeyHandlers,
    selectedLayerId, // +++ Pass selectedLayerId
    toggleLayerVisibility, // +++ Pass visibility toggle function
    toggleLayerLoop: handleToggleLayerLoop, // +++ Pass layer loop toggle function with correct prop name
    pendingKeyframeMarker, // +++ Pass lifted state
    handleAddKeyframeAtFrame, // +++ Pass new handler function
    layers: activeLayers, // +++ Pass active layers
    toggleGroupLoop: handleToggleGroupLoop, // +++ Pass group loop toggle
    undo: handleUndo,
    redo: handleRedo,
    saveProject: () => { if (loadedProjectName) saveProjectFromHook(loadedProjectName); },
    duplicateLayer: handleDuplicateLayer,
    copyLayer: handleCopyLayer,
    pasteLayer: handlePasteLayer,
    pasteLayerToAllScenes: handlePasteLayerToAllScenes,
  });




  // --- Recreate currentProjectDataToSave needed by TopBar ---
  const currentProjectDataToSave = { scenes: scenes };

  // --- Save status label ---
  const saveStatusLabel = (() => {
    if (!lastSavedAt) return undefined;
    const diffMs = Date.now() - lastSavedAt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Saved just now';
    if (diffMin === 1) return 'Saved 1m ago';
    return `Saved ${diffMin}m ago`;
  })();

  // --- Final Render --- 
  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background">
        <TopBar
            onFileUpload={handleFileUpload}
            // onAddNewLayer={addNewLayer} // --- REMOVE from TopBar props ---
            onExport={exportHTML5Package}
            onPreview={() => { if (activeIsPlaying) togglePlay(); setIsExportPreviewOpen(true); }}
            exporting={exporting}
            isBatchExporting={isBatchExporting}
            uploadError={uploadError}
            currentProjectData={currentProjectDataToSave} // +++ Pass recreated data
            hasDataToSave={currentProjectDataForTopBar.hasDataToSave} // REMOVE this prop?
            canSaveNow={!!loadedProjectName}
            loadedProjectName={loadedProjectName}
            onLoadProjectData={handleLoadProject}
            onSaveProject={async (name: string) => {
              const ok = await saveProjectFromHook(name);
              if (ok) setLastSavedAt(new Date());
              return ok;
            }}
            onBatchExport={handleBatchExport}
            sceneCount={scenes.length}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onShowShortcuts={() => setIsShortcutsHelpOpen(true)}
            saveStatus={saveStatusLabel}
            exportFilename={exportFilename}
            exportTarget={exportTarget}
            onExportFilenameChange={setExportFilename}
            onExportTargetChange={setExportTarget}
        />
        
        <SceneTabs 
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelectScene={setActiveSceneId} 
          onAddScene={handleInitiateAddScene}
          onRenameScene={handleRenameScene} 
          onDeleteScene={handleInitiateDeleteScene} 
          onReorderScenes={handleReorderScenes}
        />

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <CanvasToolbar
              controls={canvasControls}
              stageSize={activeStageSize}
              containerRef={scrollContainerRef}
            />
            <CanvasArea
              layers={activeLayers}
              animations={activeAnimations}
              currentFrame={activeCurrentFrame}
              totalFrames={activeTotalFrames}
              stageSize={activeStageSize}
              selectedLayerId={selectedLayerId}
              images={images}
              stageRef={stageRef}
              editingKeyframe={editingKeyframe}
              onLayerSelect={handleLayerSelect}
              onDragEnd={handleDragEnd}
              onStageClick={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'stage-boundary'
                if (clickedOnEmpty) {
                  setSelectedLayerId(null)
                } else {
                  const clickedId = e.target.id()
                  if (clickedId) {
                    handleLayerSelect(clickedId)
                  }
                }
              }}
              onLayerTransformEnd={handleLayerTransformEnd}
              onUpdateLayerProperty={updateLayerProperty}
              canvasControls={canvasControls}
              scrollContainerRef={scrollContainerRef}
              onWheelZoom={(delta) => {
                if (delta > 0) canvasControls.zoomOut();
                else canvasControls.zoomIn();
              }}
            />
          </div>

          <PropertiesPanel
            selectedLayer={selectedLayer} 
            stageSize={activeStageSize}
            totalDuration={activeTotalDuration} 
            fps={activeFps} 
            animations={activeAnimations}
            currentFrame={activeCurrentFrame}
            selectedKeyframe={editingKeyframe} 
            editingKeyframe={editingKeyframe} 
            onUpdateLayerProperty={updateLayerProperty}
            onSetStageSize={handleSetStageSize}
            onSetTotalDuration={handleSetTotalDuration} 
            onSetFps={handleSetFps} 
            onTemplateSelect={handleTemplateSelect}
            onUpdateKeyframe={handleUpdateKeyframe}
            onSetKeyframeProperty={handleSetKeyframeProperty}
            onDeleteKeyframe={handleDeleteKeyframe}
            onDeleteLayer={handleDeleteLayer} // Pass down delete layer handler
            onDuplicateLayer={handleDuplicateLayer}
            activeTab={activePropertiesTab}
            onTabChange={setActivePropertiesTab}
            onSetGlobalLoop={handleSetGlobalLoop}
            onToggleLayerLoop={handleToggleLayerLoop}
            onToggleGroupExpansion={handleToggleGroupExpansion}
            onToggleGroupLoop={handleToggleGroupLoop}
            scenes={scenes}
            onUseAsset={handleUseAsset}
            onSaveAsTemplate={handleSaveAsTemplate}
          />

        </div>

        <TimelineSection
          layers={activeLayers}
          animations={activeAnimations}
          selectedLayerId={selectedLayerId}
          editingKeyframe={editingKeyframe}
          fps={activeFps} 
          currentFrame={activeCurrentFrame}
          totalFrames={activeTotalFrames} 
          isPlaying={activeIsPlaying}
          isRenaming={isRenaming}
          onSetCurrentFrame={(frame: number) => updateSceneState(activeSceneId, { currentFrame: frame })}
          onTogglePlay={togglePlay}
          onStopAnimation={stopAnimation}
          onToggleLayerVisibility={toggleLayerVisibility}
          onAddKeyframe={handleAddKeyframeForLayer}
          onSelectLayer={handleLayerSelect}
          onSetEditingKeyframe={handleSetEditingKeyframe}
          onUpdateKeyframeFrame={handleUpdateKeyframeFrame}
          onBulkMoveKeyframes={handleBulkMoveKeyframes}
          onTimelineMouseDown={handleTimelineMouseDown}
          onPlayheadMouseDown={handlePlayheadMouseDown}
          onSetIsRenaming={setIsRenaming}
          onUpdateLayerName={handleUpdateLayerName}
          onReorderLayers={handleReorderLayers}
          onDeleteKeyframe={handleDeleteKeyframe}
          onPasteKeyframe={handlePasteKeyframe}
          onToggleLayerLoop={handleToggleLayerLoop}
          onToggleGroupExpansion={handleToggleGroupExpansion}
          onToggleGroupLoop={handleToggleGroupLoop}
          onToggleLayerLock={handleToggleLayerLock}
          timelineHeaderRef={timelineHeaderRef}
          timelineAreaRef={timelineAreaRef} 
          groupLoopStates={groupLoopStates} 
          onAddNewLayer={addNewLayer}
          onShowLayersDebug={() => setIsLayersDebugModalOpen(true)} // +++ Pass Debug Toggle +++
          onCopyLayer={handleCopyLayer}
          onPasteLayer={handlePasteLayer}
          onPasteLayerToAllScenes={handlePasteLayerToAllScenes}
          hasLayerClipboard={hasLayerClipboard}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          pendingKeyframeMarker={pendingKeyframeMarker}
          setPendingKeyframeMarker={setPendingKeyframeMarker}
          onAddKeyframeAtFrame={handleAddKeyframeAtFrame} // Pass the new function
        />

        {/* Template Load Confirmation Dialog */}
        <AlertDialog open={isTemplateConfirmOpen} onOpenChange={setIsTemplateConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Overwrite Unsaved Changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Loading a template will discard them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsTemplateConfirmOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (templateToLoad) loadTemplateAndReset(templateToLoad); setIsTemplateConfirmOpen(false); }}>Load Anyway</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Scene Deletion Confirmation Dialog */} 
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scene?</AlertDialogTitle>
              <AlertDialogDescription>
                Delete "{scenes.find(s => s.id === sceneToDeleteId)?.name || 'Selected Scene'}"? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteScene} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Scene</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Template Selector Dialog */} 
        <TemplateSelectorDialog
          isOpen={isTemplateSelectorOpen}
          onOpenChange={setIsTemplateSelectorOpen}
          onSelectTemplate={handleTemplateSelected}
          onCreateCustomScene={handleCreateCustomScene}
          onLoadCustomTemplate={handleLoadCustomTemplate}
        />

        {/* SVG Import Options Dialog */} 
        <ImportSvgOptionsDialog 
          isOpen={isSvgImportOptionsOpen}
          onOpenChange={setIsSvgImportOptionsOpen}
          onSelectOption={handleSvgImportOptionSelected}
        />

        {/* +++ Layers Debug Modal +++ */}
        <LayersDebugModal
           isOpen={isLayersDebugModalOpen}
           onClose={() => setIsLayersDebugModalOpen(false)}
           layersData={activeLayers} // Pass the active scene's layers
        />

        <ExportPreviewModal
          open={isExportPreviewOpen}
          onClose={() => setIsExportPreviewOpen(false)}
          config={isExportPreviewOpen ? {
            layers: activeLayers,
            animations: activeAnimations,
            fps: activeFps,
            totalFrames: activeTotalFrames,
            stageSize: activeStageSize,
          } : null}
          onExport={exportHTML5Package}
          exporting={exporting}
        />

        <ExportProgressModal
          isOpen={isExportProgressOpen}
          isComplete={exportIsComplete}
          log={exportLog}
          onClose={() => setIsExportProgressOpen(false)}
        />

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp open={isShortcutsHelpOpen} onOpenChange={setIsShortcutsHelpOpen} />

      </div>
    </TooltipProvider>
  )
}

export default AppWithLogging
