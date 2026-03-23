import {
  LayerData,
  LayerType,
  LayerTransformProps,
  ColorLayerData,
  TextLayerData,
  ImageLayerData,
  GradientLayerData,
  GroupLayerData,
  MaskLayerData,
  BlendMode,
  LayerProperty
} from '@/types/index';

export const handleDragEnd = (
  layers: LayerData[],
  layerId: string,
  newX: number,
  newY: number
): LayerData[] => {
  return layers.map(layer =>
    layer.id === layerId
      ? { ...layer, x: newX, y: newY }
      : layer
  );
};

export const toggleLayerVisibility = (
  layers: LayerData[],
  layerId: string
): LayerData[] => {
  return layers.map(layer =>
    layer.id === layerId
      ? { ...layer, visible: !layer.visible }
      : layer
  );
};

export const updateLayerProperty = (
  layers: LayerData[],
  layerId: string,
  property: LayerProperty,
  value: Partial<LayerData>
): LayerData[] => {
  // Log received arguments
  console.log(`[updateLayerProperty] Updating layer ${layerId}. Property: ${property}. Value:`, JSON.parse(JSON.stringify(value)));
  return layers.map(layer =>
    layer.id === layerId
      ? { ...layer, [property]: value }
      : layer
  );
};

export const handleReorderLayers = (
  layers: LayerData[],
  draggedId: string,
  targetId: string | null
): LayerData[] => {
  const draggedItemIndex = layers.findIndex(layer => layer.id === draggedId);
  if (draggedItemIndex === -1) {
    console.warn('[handleReorderLayers] Dragged item not found:', draggedId);
    return layers;
  }
  
  const draggedItem = layers[draggedItemIndex];
  const remainingItems = layers.filter(layer => layer.id !== draggedId);
  
  let insertionIndex = 0; // Default to start (visually bottom)
  
  if (targetId === null) {
    // Dropped at the bottom visually -> insert at the start of the array
    insertionIndex = 0;
    console.log('[handleReorderLayers] Target is null, inserting at index 0 (visually bottom).');
  } else {
    // Target is a layer ID -> Insert *after* the target layer
    const targetLayerIndex = remainingItems.findIndex(layer => layer.id === targetId);
    
    if (targetLayerIndex !== -1) {
      // Insert *after* the target's index in the remaining items array
      insertionIndex = targetLayerIndex + 1; 
      console.log(`[handleReorderLayers] Target is ${targetId}, inserting at index ${insertionIndex} (after target).`);
    } else {
      // Target not found? Default to inserting at the end (visually top) - unlikely case
      console.warn('[handleReorderLayers] Target layer not found in remaining items:', targetId, '. Inserting at end.');
      insertionIndex = remainingItems.length;
    }
  }
  
  // Clamp index (safety check, should be handled by logic above)
  insertionIndex = Math.max(0, Math.min(remainingItems.length, insertionIndex));
  
  // Insert the dragged item at the calculated index
  return [
    ...remainingItems.slice(0, insertionIndex),
    draggedItem,
    ...remainingItems.slice(insertionIndex)
  ];
};

export const handleLayerTransformEnd = (
  layers: LayerData[],
  layerId: string,
  newProps: LayerTransformProps
): LayerData[] => {
  return layers.map(layer =>
    layer.id === layerId
      ? { ...layer, ...newProps }
      : layer
  );
};

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const addNewLayer = (
  layers: LayerData[],
  type: LayerType
): LayerData => {
  const newLayerId = `${type}-${Date.now()}`;
  const commonBase = {
    id: newLayerId,
    x: 50,
    y: 50,
    visible: true,
    opacity: 1,
    blendMode: 'normal' as BlendMode,
  };

  switch (type) {
    case 'color': {
      const layer: ColorLayerData = {
        ...commonBase,
        type: 'color',
        name: `Color Layer ${layers.filter(l => l.type === 'color').length + 1}`,
        width: 100,
        height: 100,
        fill: getRandomColor(),
      };
      return layer;
    }
    case 'text': {
      const layer: TextLayerData = {
        ...commonBase,
        type: 'text',
        name: `Text Layer ${layers.filter(l => l.type === 'text').length + 1}`,
        width: 150,
        height: 30,
        content: 'New Text Layer',
        fill: '#000000',
        font: {
          family: 'Arial',
          size: 20,
          weight: 400,
          style: 'normal',
          letterSpacing: 0,
          lineHeight: 1.2
        },
        alignment: 'left',
        rotation: 0
      };
      return layer;
    }
    case 'image': {
      const layer: ImageLayerData = {
        ...commonBase,
        type: 'image',
        name: `Image Layer ${layers.filter(l => l.type === 'image').length + 1}`,
        width: 100,
        height: 100,
        src: '',
        fit: 'contain',
        rotation: 0
      };
      return layer;
    }
    case 'gradient': {
      const layer: GradientLayerData = {
        ...commonBase,
        type: 'gradient',
        name: `Gradient Layer ${layers.filter(l => l.type === 'gradient').length + 1}`,
        width: 200,
        height: 100,
        gradient: {
          type: 'linear',
          stops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 1 }
          ],
          angle: 0,
          center: { x: 0.5, y: 0.5 }
        }
      };
      return layer;
    }
    case 'group': {
      const layer: GroupLayerData = {
        ...commonBase,
        type: 'group',
        name: `Group ${layers.filter(l => l.type === 'group').length + 1}`,
        width: 200,
        height: 150,
        children: [],
        isExpanded: true
      };
      return layer;
    }
    case 'mask': {
      const layer: MaskLayerData = {
        ...commonBase,
        type: 'mask',
        name: `Mask ${layers.filter(l => l.type === 'mask').length + 1}`,
        width: 100,
        height: 100,
        maskType: 'alpha',
        inverted: false,
        featherAmount: 0
      };
      return layer;
    }
    default:
      throw new Error(`Unknown layer type: ${type}`);
  }
}; 