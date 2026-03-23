import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addNewLayer as addNewLayerUtil } from '../utils/layerManagement';
import type {
  AnimationScene,
  LayerData,
  AnimationData,
  Keyframe,
  StageSize,
  PropertyUpdateCallback,
  LayerProperty,
  LayerPropertyValue,
  TextLayerData,
  PendingKeyframeMarker,
} from '@/types/index';

type SetScenes = (updater: AnimationScene[] | ((prev: AnimationScene[]) => AnimationScene[])) => void;

interface UseLayerOperationsOptions {
  activeSceneId: string;
  activeLayers: LayerData[];
  scenes: AnimationScene[];
  setScenes: SetScenes;
  markUnsavedChanges: (sceneId: string) => void;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  setEditingKeyframe: (kf: { layerId: string; index: number } | null) => void;
  setActivePropertiesTab: (tab: string) => void;
  handleSetKeyframeProperty: (layerId: string, property: LayerProperty, value: number | string) => void;
  setPendingKeyframeMarker: (marker: PendingKeyframeMarker) => void;
}

interface UseLayerOperationsReturn {
  // layer clipboard
  layerClipboard: { layer: LayerData; animation: AnimationData | undefined } | null;
  hasLayerClipboard: boolean;
  // callbacks
  updateLayerProperty: PropertyUpdateCallback;
  handleLayerChange: (layerId: string, props: Partial<LayerData>) => void;
  handleDragEnd: (layerId: string, x: number, y: number) => void;
  handleLayerTransformEnd: (layerId: string, newProps: Partial<LayerData>) => void;
  toggleLayerVisibility: (layerId: string) => void;
  handleLayerSelect: (layerId: string | null) => void;
  handleReorderLayers: (draggedId: string, targetId: string | null) => void;
  addNewLayer: (type: LayerData['type']) => void;
  handleUpdateKeyframe: (layerId: string, keyframeIndex: number, updates: Partial<Keyframe>) => void;
  handleUpdateLayerName: (layerId: string, newName: string) => void;
  handleDeleteLayer: (layerIdToDelete: string) => void;
  handleSetEditingKeyframe: (keyframe: { layerId: string; index: number } | null) => void;
  handleSetStageSize: (newSize: StageSize | ((prev: StageSize) => StageSize)) => void;
  handleSetTotalDuration: (newDuration: number | ((prev: number) => number)) => void;
  handleSetFps: (newFps: number | ((prev: number) => number)) => void;
  handleSetGlobalLoop: (loop: boolean) => void;
  handleToggleLayerLoop: (layerId: string) => void;
  handleToggleGroupExpansion: (groupId: string) => void;
  handleToggleGroupLoop: (groupId: string) => void;
  handleAddKeyframeAtFrame: (layerId: string, frame: number) => void;
  handlePasteKeyframe: (layerId: string, frame: number, values: Omit<Keyframe, 'frame'>) => void;
  handleCopyLayer: (layerId: string) => void;
  handlePasteLayer: () => void;
  handlePasteLayerToAllScenes: () => void;
  handleDuplicateLayer: (layerId: string) => void;
  handleToggleLayerLock: (layerId: string) => void;
}

export function useLayerOperations({
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
}: UseLayerOperationsOptions): UseLayerOperationsReturn {
  const [layerClipboard, setLayerClipboard] = useState<{
    layer: LayerData;
    animation: AnimationData | undefined;
  } | null>(null);

  // ── Property Updates ─────────────────────────────────────────────────────────

  const updateLayerProperty: PropertyUpdateCallback = useCallback((
    layerId: string | null,
    property: LayerProperty,
    value: LayerPropertyValue,
  ) => {
    const targetLayerId = layerId ?? selectedLayerId;
    if (!targetLayerId) return;

    const animatableProperties: (keyof Keyframe)[] = [
      'x', 'y', 'opacity', 'width', 'height', 'rotation', 'scaleX', 'scaleY', 'easing',
    ];
    const isKeyframeProp = animatableProperties.includes(property as keyof Keyframe);

    if (isKeyframeProp) {
      if (typeof value === 'number' || typeof value === 'string') {
        handleSetKeyframeProperty(targetLayerId, property, value);
      } else {
        console.warn(`[updateLayerProperty] Value for animatable property ${String(property)} is not string or number.`);
      }
    } else {
      setScenes(currentScenes => currentScenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;
        const updatedLayers = scene.layers.map(l => {
          if (l.id !== targetLayerId) return l;

          if (property.startsWith('font.') && l.type === 'text') {
            const fontProp = property.split('.')[1] as keyof TextLayerData['font'];
            let typedValue = value;
            if (['size', 'weight', 'letterSpacing', 'lineHeight'].includes(fontProp)) {
              if (typeof value === 'string' || typeof value === 'number') {
                typedValue = parseFloat(String(value)) || 0;
              } else {
                typedValue = (l as TextLayerData).font[fontProp];
              }
            } else if (fontProp === 'family' && typeof value !== 'string') {
              typedValue = String(value);
            } else if (fontProp === 'style' && typeof value !== 'string') {
              typedValue = 'normal';
            }
            if (fontProp in (l as TextLayerData).font) {
              return { ...l, font: { ...(l as TextLayerData).font, [fontProp]: typedValue } };
            }
            return l;
          }

          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            (property === 'font' && typeof value === 'object' && value !== null) ||
            property === 'blendMode'
          ) {
            if (property in l || property === 'font' || property === 'blendMode' || property === 'src') {
              return { ...l, [property]: value };
            }
          }
          return l;
        });
        return { ...scene, layers: updatedLayers.map(l => l as LayerData) };
      }));
      markUnsavedChanges(activeSceneId);
    }
  }, [activeSceneId, selectedLayerId, handleSetKeyframeProperty, setScenes, markUnsavedChanges]);

  const handleLayerChange = useCallback((layerId: string, props: Partial<LayerData>) => {
    if (props.x !== undefined) handleSetKeyframeProperty(layerId, 'x', props.x);
    if (props.y !== undefined) handleSetKeyframeProperty(layerId, 'y', props.y);
    if (props.width !== undefined) handleSetKeyframeProperty(layerId, 'width', props.width);
    if (props.height !== undefined) handleSetKeyframeProperty(layerId, 'height', props.height);
    if (props.opacity !== undefined) handleSetKeyframeProperty(layerId, 'opacity', props.opacity);
    if (props.rotation !== undefined) handleSetKeyframeProperty(layerId, 'rotation', props.rotation);
    if (props.scaleX !== undefined) handleSetKeyframeProperty(layerId, 'scaleX', props.scaleX);
    if (props.scaleY !== undefined) handleSetKeyframeProperty(layerId, 'scaleY', props.scaleY);
  }, [handleSetKeyframeProperty]);

  const handleDragEnd = useCallback((layerId: string, x: number, y: number) => {
    handleLayerChange(layerId, { x, y });
    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      markUnsavedChanges(activeSceneId);
      return { ...scene, layers: scene.layers.map(l => l.id === layerId ? { ...l, x, y } as LayerData : l) };
    }));
  }, [activeSceneId, handleLayerChange, setScenes, markUnsavedChanges]);

  const handleLayerTransformEnd = useCallback((layerId: string, newProps: Partial<LayerData>) => {
    handleLayerChange(layerId, newProps);
    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      markUnsavedChanges(activeSceneId);
      return { ...scene, layers: scene.layers.map(l => l.id === layerId ? { ...l, ...newProps } as LayerData : l) };
    }));
  }, [activeSceneId, handleLayerChange, setScenes, markUnsavedChanges]);

  // ── Visibility / Selection ────────────────────────────────────────────────────

  const toggleLayerVisibility = useCallback((layerId: string) => {
    const getAllDescendantIds = (parentId: string, allLayers: LayerData[]): string[] => {
      const children = allLayers.filter(l => l.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(child => {
        if (child.type === 'group') ids = ids.concat(getAllDescendantIds(child.id, allLayers));
      });
      return ids;
    };

    setScenes(currentScenes => currentScenes.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const layerToToggle = scene.layers.find(l => l.id === layerId);
      if (!layerToToggle) return scene;
      const newVisibility = !(layerToToggle.visible ?? true);
      const idsToUpdate = layerToToggle.type === 'group'
        ? new Set([layerId, ...getAllDescendantIds(layerId, scene.layers)])
        : new Set([layerId]);
      return { ...scene, layers: scene.layers.map(l => idsToUpdate.has(l.id) ? { ...l, visible: newVisibility } : l) };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  const handleLayerSelect = useCallback((layerId: string | null) => {
    setSelectedLayerId(layerId);
    setEditingKeyframe(null);
  }, [setSelectedLayerId, setEditingKeyframe]);

  // ── Reorder ───────────────────────────────────────────────────────────────────

  const handleReorderLayers = useCallback((draggedId: string, targetId: string | null) => {
    const getLayerBlock = (rootId: string, allLayers: LayerData[]): LayerData[] => {
      const block: LayerData[] = [];
      const rootLayer = allLayers.find(l => l.id === rootId);
      if (!rootLayer) return [];
      const processed = new Set<string>();
      const processLayer = (layer: LayerData) => {
        if (processed.has(layer.id)) return;
        processed.add(layer.id);
        allLayers.forEach(child => { if (child.parentId === layer.id) processLayer(child); });
        block.push(layer);
      };
      processLayer(rootLayer);
      return block;
    };

    if (targetId && targetId.startsWith('parent:')) {
      const groupId = targetId.split(':')[1];
      const draggedBlock = getLayerBlock(draggedId, activeLayers);
      if (!draggedBlock.length) return;
      const draggedBlockIds = new Set(draggedBlock.map(l => l.id));
      const layersWithoutBlock = activeLayers.filter(l => !draggedBlockIds.has(l.id));
      const updatedBlock = draggedBlock.map((layer, i) =>
        i === draggedBlock.length - 1 ? { ...layer, parentId: groupId } : layer
      );
      let insertionIndex = layersWithoutBlock.findIndex(l => l.id === groupId);
      if (insertionIndex === -1) insertionIndex = layersWithoutBlock.length;
      const finalLayers = [...layersWithoutBlock.slice(0, insertionIndex), ...updatedBlock, ...layersWithoutBlock.slice(insertionIndex)];
      setScenes(cs => cs.map(scene => scene.id !== activeSceneId ? scene : { ...scene, layers: finalLayers }));
      markUnsavedChanges(activeSceneId);
      return;
    }

    const draggedBlock = getLayerBlock(draggedId, activeLayers);
    if (!draggedBlock.length) return;
    const draggedBlockIds = new Set(draggedBlock.map(l => l.id));
    const layersWithoutBlock = activeLayers.filter(l => !draggedBlockIds.has(l.id));
    let insertionIndex: number;
    let newParentId: string | undefined;

    if (targetId === '__MOVE_TO_END__') {
      insertionIndex = layersWithoutBlock.length;
      newParentId = undefined;
    } else if (targetId === null) {
      insertionIndex = 0;
      newParentId = undefined;
    } else {
      const targetLayer = activeLayers.find(l => l.id === targetId);
      if (!targetLayer) return;
      insertionIndex = layersWithoutBlock.findIndex(l => l.id === targetId);
      if (insertionIndex === -1) { insertionIndex = layersWithoutBlock.length; newParentId = undefined; }
      else { newParentId = targetLayer.parentId; insertionIndex++; }
    }

    const updatedBlock = draggedBlock.map((layer, i) =>
      i === draggedBlock.length - 1 ? { ...layer, parentId: newParentId } : layer
    );
    const finalLayers = [...layersWithoutBlock.slice(0, insertionIndex), ...updatedBlock, ...layersWithoutBlock.slice(insertionIndex)];
    setScenes(cs => cs.map(scene => scene.id !== activeSceneId ? scene : { ...scene, layers: finalLayers }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, activeLayers, markUnsavedChanges, setScenes]);

  // ── Add / Delete / Name ───────────────────────────────────────────────────────

  const addNewLayer = useCallback((type: LayerData['type']) => {
    const newLayer = addNewLayerUtil(activeLayers, type);
    setScenes(cs => cs.map(scene => scene.id !== activeSceneId ? scene : { ...scene, layers: [...scene.layers, newLayer] }));
    setSelectedLayerId(newLayer.id);
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, activeLayers, markUnsavedChanges, setScenes, setSelectedLayerId]);

  const handleUpdateLayerName = useCallback((layerId: string, newName: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      markUnsavedChanges(activeSceneId);
      return { ...scene, layers: scene.layers.map(l => l.id === layerId ? { ...l, name: newName } : l) };
    }));
  }, [activeSceneId, setScenes, markUnsavedChanges]);

  const handleDeleteLayer = useCallback((layerIdToDelete: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return {
        ...scene,
        layers: scene.layers.filter(l => l.id !== layerIdToDelete && l.parentId !== layerIdToDelete),
        animations: scene.animations.filter(a => a.layerId !== layerIdToDelete),
      };
    }));
    if (selectedLayerId === layerIdToDelete) setSelectedLayerId(null);
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, selectedLayerId, markUnsavedChanges, setScenes, setSelectedLayerId]);

  // ── Keyframe editing ─────────────────────────────────────────────────────────

  const handleSetEditingKeyframe = useCallback((keyframe: { layerId: string; index: number } | null) => {
    setEditingKeyframe(keyframe);
    if (keyframe) setActivePropertiesTab('animation');
  }, [setEditingKeyframe, setActivePropertiesTab]);

  const handleUpdateKeyframe = useCallback((layerId: string, keyframeIndex: number, updates: Partial<Keyframe>) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const updatedAnimations = scene.animations.map(anim => {
        if (anim.layerId !== layerId) return anim;
        const updatedKeyframes = anim.keyframes.map((kf, index) => {
          if (index !== keyframeIndex) return kf;
          const newFrame = updates.frame !== undefined ? Number(updates.frame) : kf.frame;
          if (isNaN(newFrame)) return { ...kf, ...updates, frame: kf.frame };
          return { ...kf, ...updates, frame: newFrame };
        });
        updatedKeyframes.sort((a, b) => a.frame - b.frame);
        return { ...anim, keyframes: updatedKeyframes };
      });
      markUnsavedChanges(activeSceneId);
      return { ...scene, animations: updatedAnimations };
    }));
  }, [activeSceneId, setScenes, markUnsavedChanges]);

  const handleAddKeyframeAtFrame = useCallback((layerId: string, frame: number) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const layerToAddTo = scene.layers.find(l => l.id === layerId);
      if (!layerToAddTo) return scene;

      const baseProps: Keyframe = {
        frame,
        x: layerToAddTo.x ?? 0,
        y: layerToAddTo.y ?? 0,
        width: layerToAddTo.width ?? 0,
        height: layerToAddTo.height ?? 0,
        opacity: layerToAddTo.opacity ?? 1,
        rotation: layerToAddTo.rotation ?? 0,
        scaleX: layerToAddTo.scaleX ?? 1,
        scaleY: layerToAddTo.scaleY ?? 1,
        easing: 'linear',
      };

      let animationExists = false;
      const updatedAnimations = scene.animations.map(anim => {
        if (anim.layerId !== layerId) return anim;
        animationExists = true;
        const existingIdx = anim.keyframes.findIndex(kf => kf.frame === frame);
        const updatedKeyframes = existingIdx !== -1
          ? anim.keyframes.map((kf, i) => i === existingIdx ? { ...kf, ...baseProps } : kf)
          : [...anim.keyframes, baseProps].sort((a, b) => a.frame - b.frame);
        return { ...anim, keyframes: updatedKeyframes };
      });

      if (!animationExists) {
        updatedAnimations.push({ layerId, keyframes: [baseProps], loop: false });
      }

      markUnsavedChanges(activeSceneId);
      return { ...scene, animations: updatedAnimations };
    }));
    setPendingKeyframeMarker(null);
  }, [activeSceneId, setScenes, markUnsavedChanges, setPendingKeyframeMarker]);

  const handlePasteKeyframe = useCallback((layerId: string, frame: number, values: Omit<Keyframe, 'frame'>) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const updatedAnimations = scene.animations.map(anim => {
        if (anim.layerId !== layerId) return anim;
        const existingIdx = anim.keyframes.findIndex(kf => kf.frame === frame);
        const updatedKeyframes = existingIdx >= 0
          ? anim.keyframes.map((kf, i) => i === existingIdx ? { ...kf, ...values, frame } : kf)
          : [...anim.keyframes, { ...values, frame } as Keyframe].sort((a, b) => a.frame - b.frame);
        return { ...anim, keyframes: updatedKeyframes };
      });
      if (!updatedAnimations.some(a => a.layerId === layerId)) {
        updatedAnimations.push({ layerId, keyframes: [{ ...values, frame } as Keyframe], loop: false });
      }
      markUnsavedChanges(activeSceneId);
      return { ...scene, animations: updatedAnimations };
    }));
  }, [activeSceneId, setScenes, markUnsavedChanges]);

  // ── Stage / Timeline Config ──────────────────────────────────────────────────

  const handleSetStageSize = useCallback((newSize: StageSize | ((prev: StageSize) => StageSize)) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, stageSize: typeof newSize === 'function' ? newSize(scene.stageSize) : newSize };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  const handleSetTotalDuration = useCallback((newDuration: number | ((prev: number) => number)) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, totalDuration: typeof newDuration === 'function' ? newDuration(scene.totalDuration) : newDuration };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  const handleSetFps = useCallback((newFps: number | ((prev: number) => number)) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, fps: typeof newFps === 'function' ? newFps(scene.fps) : newFps };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  // ── Loop controls ─────────────────────────────────────────────────────────────

  const handleSetGlobalLoop = useCallback((loop: boolean) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, animations: scene.animations.map(anim => ({ ...anim, loop })) };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  const handleToggleLayerLoop = useCallback((layerId: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, animations: scene.animations.map(anim => anim.layerId === layerId ? { ...anim, loop: !anim.loop } : anim) };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  const handleToggleGroupExpansion = useCallback((groupId: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, layers: scene.layers.map(l => l.id === groupId && l.type === 'group' ? { ...l, isExpanded: !(l.isExpanded ?? true) } : l) };
    }));
  }, [activeSceneId, setScenes]);

  const handleToggleGroupLoop = useCallback((groupId: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const childIds = scene.layers.filter(l => l.parentId === groupId).map(l => l.id);
      if (!childIds.length) return scene;
      let allLooping = true;
      let hasAnimatable = false;
      childIds.forEach(id => {
        const anim = scene.animations.find(a => a.layerId === id);
        if (anim && anim.keyframes.length > 0) { hasAnimatable = true; if (!anim.loop) allLooping = false; }
      });
      if (!hasAnimatable) return scene;
      const newLoop = !allLooping;
      let changed = false;
      const updatedAnimations = scene.animations.map(anim => {
        if (childIds.includes(anim.layerId) && anim.keyframes.length > 0 && anim.loop !== newLoop) {
          changed = true;
          return { ...anim, loop: newLoop };
        }
        return anim;
      });
      if (!changed) return scene;
      markUnsavedChanges(activeSceneId);
      return { ...scene, animations: updatedAnimations };
    }));
  }, [activeSceneId, markUnsavedChanges, setScenes]);

  // ── Copy / Paste / Duplicate / Lock ──────────────────────────────────────────

  const handleCopyLayer = useCallback((layerId: string) => {
    const scene = scenes.find(s => s.id === activeSceneId);
    if (!scene) return;
    const layer = scene.layers.find(l => l.id === layerId);
    if (!layer) return;
    const animation = scene.animations.find(a => a.layerId === layerId);
    setLayerClipboard({
      layer: JSON.parse(JSON.stringify(layer)),
      animation: animation ? JSON.parse(JSON.stringify(animation)) : undefined,
    });
  }, [scenes, activeSceneId]);

  const handlePasteLayer = useCallback(() => {
    if (!layerClipboard) return;
    const { layer, animation } = layerClipboard;
    const newId = uuidv4();
    const newLayer: LayerData = { ...JSON.parse(JSON.stringify(layer)), id: newId, name: `${layer.name} copy`, x: (layer.x ?? 0) + 10, y: (layer.y ?? 0) + 10 };
    const newAnimation = animation ? { ...JSON.parse(JSON.stringify(animation)), layerId: newId } : undefined;
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, layers: [...scene.layers, newLayer], animations: newAnimation ? [...scene.animations, newAnimation] : scene.animations };
    }));
    setSelectedLayerId(newId);
    markUnsavedChanges(activeSceneId);
  }, [layerClipboard, activeSceneId, setScenes, markUnsavedChanges, setSelectedLayerId]);

  const handlePasteLayerToAllScenes = useCallback(() => {
    if (!layerClipboard) return;
    const { layer, animation } = layerClipboard;
    setScenes(cs => cs.map(scene => {
      const newId = uuidv4();
      const newLayer: LayerData = { ...JSON.parse(JSON.stringify(layer)), id: newId };
      const newAnimation = animation ? { ...JSON.parse(JSON.stringify(animation)), layerId: newId } : undefined;
      return { ...scene, layers: [...scene.layers, newLayer], animations: newAnimation ? [...scene.animations, newAnimation] : scene.animations };
    }));
    markUnsavedChanges(activeSceneId);
  }, [layerClipboard, setScenes, markUnsavedChanges, activeSceneId]);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const original = scene.layers.find(l => l.id === layerId);
      if (!original) return scene;
      const newId = uuidv4();
      const newLayer: LayerData = { ...original, id: newId, name: `${original.name} copy`, x: (original.x ?? 0) + 10, y: (original.y ?? 0) + 10 };
      const originalAnim = scene.animations.find(a => a.layerId === layerId);
      const newAnimations = originalAnim
        ? [...scene.animations, { ...originalAnim, layerId: newId, keyframes: originalAnim.keyframes.map(kf => ({ ...kf })) }]
        : scene.animations;
      return { ...scene, layers: [...scene.layers, newLayer], animations: newAnimations };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, setScenes, markUnsavedChanges]);

  const handleToggleLayerLock = useCallback((layerId: string) => {
    setScenes(cs => cs.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      return { ...scene, layers: scene.layers.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l) };
    }));
    markUnsavedChanges(activeSceneId);
  }, [activeSceneId, setScenes, markUnsavedChanges]);

  return {
    layerClipboard,
    hasLayerClipboard: layerClipboard !== null,
    updateLayerProperty,
    handleLayerChange,
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
  };
}
