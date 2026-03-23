import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parseFile, validateFileType } from '../utils/fileOperations';
import type { AnimationScene, LayerData } from '@/types/index';

type SetScenes = (updater: (prev: AnimationScene[]) => AnimationScene[]) => void;

interface UseSvgImportOptions {
  activeSceneId: string;
  setScenes: SetScenes;
  setActiveSceneId: (id: string) => void;
  markUnsavedChanges: (sceneId: string) => void;
}

interface UseSvgImportReturn {
  uploadError: string | null;
  isSvgImportOptionsOpen: boolean;
  setIsSvgImportOptionsOpen: (v: boolean) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSvgImportOptionSelected: (option: 'current' | 'new') => void;
}

export function useSvgImport({
  activeSceneId,
  setScenes,
  setActiveSceneId,
  markUnsavedChanges,
}: UseSvgImportOptions): UseSvgImportReturn {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingSvgLayers, setPendingSvgLayers] = useState<LayerData[] | null>(null);
  const [pendingSvgSize, setPendingSvgSize] = useState<{ width: number; height: number } | null>(null);
  const [isSvgImportOptionsOpen, setIsSvgImportOptionsOpen] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFileType(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    const result = await parseFile(file);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.layers.length > 0) {
      setPendingSvgLayers(result.layers);
      setPendingSvgSize(result.svgSize ?? null);
      setIsSvgImportOptionsOpen(true);
      console.log(`Parsed ${result.layers.length} layers from SVG. Opening options dialog.`);
    } else {
      alert('No layers found in the SVG file.');
    }
  }, []);

  const handleSvgImportOptionSelected = useCallback((option: 'current' | 'new') => {
    if (!pendingSvgLayers) {
      console.error('SVG import option selected, but no pending layers found.');
      return;
    }

    if (option === 'current') {
      setScenes(currentScenes => currentScenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;
        return { ...scene, layers: [...scene.layers, ...pendingSvgLayers] };
      }));
      markUnsavedChanges(activeSceneId);
    } else {
      const svgName = pendingSvgLayers[0]?.name || 'Imported SVG';
      const svgW = pendingSvgSize?.width ?? 300;
      const svgH = pendingSvgSize?.height ?? 250;
      const newScene: AnimationScene = {
        id: uuidv4(),
        name: svgName,
        layers: pendingSvgLayers,
        animations: [],
        stageSize: { width: svgW, height: svgH, devicePixelRatio: window.devicePixelRatio },
        totalDuration: 5,
        fps: 60,
        currentFrame: 0,
        isPlaying: false,
      };
      setScenes(currentScenes => [...currentScenes, newScene]);
      setActiveSceneId(newScene.id);
      markUnsavedChanges(newScene.id);
    }

    setPendingSvgLayers(null);
    setPendingSvgSize(null);
    setIsSvgImportOptionsOpen(false);
  }, [pendingSvgLayers, pendingSvgSize, activeSceneId, markUnsavedChanges, setScenes, setActiveSceneId]);

  return {
    uploadError,
    isSvgImportOptionsOpen,
    setIsSvgImportOptionsOpen,
    handleFileUpload,
    handleSvgImportOptionSelected,
  };
}
