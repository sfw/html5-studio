import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadTemplateData } from '../utils/fileOperations';
import { saveCustomTemplate } from '../utils/templateUtils';
import type { CustomTemplate } from '../utils/templateUtils';
import type { AnimationScene, LayerData, PropertyUpdateCallback } from '@/types/index';

type SetScenes = (updater: AnimationScene[] | ((prev: AnimationScene[]) => AnimationScene[])) => void;

interface UseSceneManagementOptions {
  scenes: AnimationScene[];
  activeSceneId: string;
  setScenes: SetScenes;
  setActiveSceneId: (id: string) => void;
  markUnsavedChanges: (sceneId: string) => void;
  updateSceneState: (sceneId: string, updates: Partial<AnimationScene>) => void;
  setSelectedLayerId: (id: string | null) => void;
  // For the "use asset" handler — needs to touch a layer property
  updateLayerProperty: PropertyUpdateCallback;
  selectedLayerId: string | null;
}

interface UseSceneManagementReturn {
  // dialog state
  isTemplateSelectorOpen: boolean;
  setIsTemplateSelectorOpen: (v: boolean) => void;
  isTemplateConfirmOpen: boolean;
  setIsTemplateConfirmOpen: (v: boolean) => void;
  templateToLoad: string | null;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (v: boolean) => void;
  sceneToDeleteId: string | null;
  // handlers
  handleTemplateSelect: (templateSize: string) => void;
  handleInitiateAddScene: () => void;
  handleTemplateSelected: (templateKey: string | null) => void;
  handleCreateCustomScene: (w: number, h: number, name: string) => void;
  handleLoadCustomTemplate: (template: CustomTemplate) => void;
  handleSaveAsTemplate: () => void;
  handleUseAsset: (src: string) => void;
  handleRenameScene: (sceneId: string, newName: string) => void;
  handleInitiateDeleteScene: (sceneId: string) => void;
  handleConfirmDeleteScene: () => void;
  handleReorderScenes: (draggedId: string, targetId: string) => void;
  loadTemplateAndReset: (templateSize: string) => void;
}

export function useSceneManagement({
  scenes,
  activeSceneId,
  setScenes,
  setActiveSceneId,
  markUnsavedChanges,
  updateSceneState,
  setSelectedLayerId,
  updateLayerProperty,
  selectedLayerId,
}: UseSceneManagementOptions): UseSceneManagementReturn {
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isTemplateConfirmOpen, setIsTemplateConfirmOpen] = useState(false);
  const [templateToLoad, setTemplateToLoad] = useState<string | null>(null);
  const [sceneToDeleteId, setSceneToDeleteId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const loadTemplateAndReset = useCallback((templateSize: string) => {
    try {
      const templateData = loadTemplateData(templateSize);
      const newScene: AnimationScene = {
        id: uuidv4(),
        name: templateSize,
        layers: templateData.layers,
        animations: templateData.animations,
        stageSize: templateData.stageSize,
        totalDuration: templateData.duration,
        fps: templateData.fps,
        hasUnsavedChanges: false,
        currentFrame: 0,
        isPlaying: false,
      };
      setScenes(currentScenes => [...currentScenes, newScene]);
      setActiveSceneId(newScene.id);
      updateSceneState(newScene.id, { currentFrame: 0 });
      setSelectedLayerId(null);
      console.log(`Template ${templateSize} loaded successfully!`);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template. Check console for details.');
    }
  }, [setScenes, setActiveSceneId, updateSceneState, setSelectedLayerId]);

  const handleTemplateSelect = useCallback((templateSize: string) => {
    const currentSceneHasChanges = scenes.find(s => s.id === activeSceneId)?.hasUnsavedChanges;
    if (currentSceneHasChanges) {
      setTemplateToLoad(templateSize);
      setIsTemplateConfirmOpen(true);
    } else {
      loadTemplateAndReset(templateSize);
    }
  }, [scenes, activeSceneId, loadTemplateAndReset]);

  const handleInitiateAddScene = useCallback(() => {
    setIsTemplateSelectorOpen(true);
    console.log('Opening template selector dialog...');
  }, []);

  const handleTemplateSelected = useCallback((templateKey: string | null) => {
    let newSceneData: Omit<AnimationScene, 'id' | 'name'>;
    let sceneBaseName: string;

    try {
      if (templateKey === null) {
        sceneBaseName = 'Blank Scene';
        newSceneData = {
          layers: [] as LayerData[],
          animations: [],
          stageSize: { width: 800, height: 600, devicePixelRatio: window.devicePixelRatio },
          totalDuration: 5,
          fps: 60,
          currentFrame: 0,
          isPlaying: false,
        };
      } else {
        const templateData = loadTemplateData(templateKey);
        sceneBaseName = templateKey;
        newSceneData = {
          layers: templateData.layers,
          animations: templateData.animations,
          stageSize: templateData.stageSize,
          totalDuration: templateData.duration,
          fps: templateData.fps,
          currentFrame: 0,
          isPlaying: false,
        };
      }

      const newScene: AnimationScene = {
        ...newSceneData,
        id: uuidv4(),
        name: sceneBaseName,
        currentFrame: 0,
        isPlaying: false,
      };

      setScenes(currentScenes => [...currentScenes, newScene]);
      setActiveSceneId(newScene.id);
      markUnsavedChanges(newScene.id);
      console.log('New scene added:', newScene);
    } catch (error) {
      console.error('Error processing template selection:', error);
      alert(`Failed to create scene: ${error instanceof Error ? error.message : 'Unknown error'}. Check console.`);
    }
  }, [markUnsavedChanges, setScenes, setActiveSceneId]);

  const handleCreateCustomScene = useCallback((w: number, h: number, name: string) => {
    const newScene: AnimationScene = {
      id: uuidv4(),
      name,
      layers: [],
      animations: [],
      stageSize: { width: w, height: h, devicePixelRatio: window.devicePixelRatio },
      totalDuration: 5,
      fps: 60,
      currentFrame: 0,
      isPlaying: false,
    };
    setScenes(current => [...current, newScene]);
    setActiveSceneId(newScene.id);
    markUnsavedChanges(newScene.id);
  }, [setScenes, setActiveSceneId, markUnsavedChanges]);

  const handleLoadCustomTemplate = useCallback((template: CustomTemplate) => {
    const newScene: AnimationScene = {
      id: uuidv4(),
      name: template.name,
      layers: template.layers,
      animations: template.animations,
      stageSize: { ...template.stageSize, devicePixelRatio: window.devicePixelRatio },
      totalDuration: template.duration,
      fps: template.fps,
      currentFrame: 0,
      isPlaying: false,
    };
    setScenes(current => [...current, newScene]);
    setActiveSceneId(newScene.id);
    markUnsavedChanges(newScene.id);
  }, [setScenes, setActiveSceneId, markUnsavedChanges]);

  const handleSaveAsTemplate = useCallback(() => {
    const scene = scenes.find(s => s.id === activeSceneId);
    if (!scene) return;
    const name = prompt('Template name:', scene.name);
    if (!name) return;
    saveCustomTemplate({
      name,
      stageSize: { width: scene.stageSize.width, height: scene.stageSize.height },
      layers: JSON.parse(JSON.stringify(scene.layers)),
      animations: JSON.parse(JSON.stringify(scene.animations)),
      fps: scene.fps,
      duration: scene.totalDuration,
    });
    alert(`Template "${name}" saved!`);
  }, [scenes, activeSceneId]);

  const handleUseAsset = useCallback((src: string) => {
    if (!selectedLayerId) return;
    updateLayerProperty(selectedLayerId, 'src', src);
  }, [selectedLayerId, updateLayerProperty]);

  const handleRenameScene = useCallback((sceneId: string, newName: string) => {
    if (!newName.trim()) {
      console.warn('Attempted to rename scene with an empty name. Ignoring.');
      return;
    }
    setScenes(currentScenes =>
      currentScenes.map(scene =>
        scene.id === sceneId ? { ...scene, name: newName.trim() } : scene
      )
    );
    markUnsavedChanges(sceneId);
    console.log(`Renamed scene ${sceneId} to: ${newName.trim()}`);
  }, [markUnsavedChanges, setScenes]);

  const handleInitiateDeleteScene = useCallback((sceneId: string) => {
    if (scenes.length <= 1) {
      alert('Cannot delete the last scene.');
      return;
    }
    setSceneToDeleteId(sceneId);
    setIsDeleteConfirmOpen(true);
    console.log(`Initiating delete for scene: ${sceneId}`);
  }, [scenes.length]);

  const handleConfirmDeleteScene = useCallback(() => {
    if (!sceneToDeleteId) return;

    console.log(`Confirmed delete for scene: ${sceneToDeleteId}`);

    const sceneIndexToDelete = scenes.findIndex(s => s.id === sceneToDeleteId);
    if (sceneIndexToDelete === -1) {
      console.error('Scene to delete not found!');
      setSceneToDeleteId(null);
      setIsDeleteConfirmOpen(false);
      return;
    }

    let nextActiveSceneId = activeSceneId;
    if (activeSceneId === sceneToDeleteId) {
      if (sceneIndexToDelete > 0) {
        nextActiveSceneId = scenes[sceneIndexToDelete - 1].id;
      } else {
        nextActiveSceneId = scenes[1].id;
      }
      console.log(`Deleted active scene, activating next scene: ${nextActiveSceneId}`);
    }

    setScenes(currentScenes => currentScenes.filter(scene => scene.id !== sceneToDeleteId));

    if (activeSceneId !== nextActiveSceneId) {
      setActiveSceneId(nextActiveSceneId);
    }

    scenes
      .filter(scene => scene.id !== sceneToDeleteId)
      .forEach(s => markUnsavedChanges(s.id));

    setSceneToDeleteId(null);
    setIsDeleteConfirmOpen(false);
  }, [scenes, sceneToDeleteId, activeSceneId, markUnsavedChanges, setScenes, setActiveSceneId]);

  const handleReorderScenes = useCallback((draggedId: string, targetId: string) => {
    console.log(`Attempting to reorder: Move ${draggedId} before ${targetId}`);

    const draggedIndex = scenes.findIndex(s => s.id === draggedId);
    const targetIndex = scenes.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      console.error('Could not find dragged or target scene index for reordering.');
      return;
    }

    const reorderedScenes = Array.from(scenes);
    const [removedScene] = reorderedScenes.splice(draggedIndex, 1);
    const insertionIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reorderedScenes.splice(insertionIndex, 0, removedScene);

    setScenes(reorderedScenes);
    markUnsavedChanges(activeSceneId);
    console.log('Scenes reordered successfully.');
  }, [scenes, markUnsavedChanges, activeSceneId, setScenes]);

  return {
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
  };
}
