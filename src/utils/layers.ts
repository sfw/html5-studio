import { LayerData, LayerType } from '@/types/index';

export const createLayer = (
  type: LayerType,
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100
): LayerData => {
  const id = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const baseLayer = {
    id,
    name: `New ${type} Layer`,
    type,
    visible: true,
    opacity: 1,
    x,
    y,
    width,
    height,
    blendMode: 'normal' as const,
  };

  switch (type) {
    case 'color':
      return {
        ...baseLayer,
        type: 'color',
        fill: '#000000'
      };
    case 'gradient':
      return {
        ...baseLayer,
        type: 'gradient',
        gradient: {
          type: 'linear',
          stops: [
            { color: '#000000', position: 0 },
            { color: '#ffffff', position: 1 }
          ],
          angle: 0,
          center: { x: 0.5, y: 0.5 }
        }
      };
    case 'image':
      return {
        ...baseLayer,
        type: 'image',
        src: '',
        fit: 'contain',
        rotation: 0
      };
    case 'text':
      return {
        ...baseLayer,
        type: 'text',
        content: 'New Text',
        font: {
          family: 'Arial',
          size: 16,
          weight: 400,
          style: 'normal',
          letterSpacing: 0,
          lineHeight: 1.2
        },
        fill: '#000000',
        alignment: 'left',
        rotation: 0
      };
    case 'group':
      return {
        ...baseLayer,
        type: 'group',
        children: [],
        isExpanded: true
      };
    case 'mask':
      return {
        ...baseLayer,
        type: 'mask',
        maskType: 'alpha',
        inverted: false,
        featherAmount: 0
      };
    default:
      throw new Error(`Invalid layer type: ${type}`);
  }
};

export const findLayerById = (
  layers: LayerData[],
  id: string
): LayerData | undefined => {
  for (const layer of layers) {
    if (layer.id === id) return layer;
    if ('children' in layer && layer.children?.length) {
      const found = findLayerById(layer.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

export const updateLayer = (
  layers: LayerData[],
  updatedLayer: LayerData
): LayerData[] => {
  return layers.map(layer => {
    if (layer.id === updatedLayer.id) {
      return updatedLayer;
    }
    if ('children' in layer && layer.children?.length) {
      return {
        ...layer,
        children: updateLayer(layer.children, updatedLayer),
      };
    }
    return layer;
  });
};

export const deleteLayer = (
  layers: LayerData[],
  layerId: string
): LayerData[] => {
  return layers.filter(layer => {
    if (layer.id === layerId) return false;
    if ('children' in layer && layer.children?.length) {
      layer.children = deleteLayer(layer.children, layerId);
    }
    return true;
  });
};

export const moveLayer = (
  layers: LayerData[],
  layerId: string,
  targetParentId: string | null,
  index: number
): LayerData[] => {
  
  // Remove layer from its current position
  const newLayers = deleteLayer(layers, layerId);
  const layerToMove = findLayerById([...layers], layerId);
  
  if (!layerToMove) return layers;

  if (!targetParentId) {
    // Moving to root level
    newLayers.splice(index, 0, layerToMove);
    return newLayers;
  }

  // Find target parent and insert layer
  const insertIntoParent = (parentLayers: LayerData[]): LayerData[] => {
    return parentLayers.map(layer => {
      if (layer.id === targetParentId && 'children' in layer) {
        const newChildren = [...(layer.children || [])];
        newChildren.splice(index, 0, layerToMove!);
        return { ...layer, children: newChildren };
      }
      if ('children' in layer && layer.children?.length) {
        return { ...layer, children: insertIntoParent(layer.children) };
      }
      return layer;
    });
  };

  return insertIntoParent(newLayers);
};

export const findParentId = (
  layers: LayerData[],
  layerId: string,
  parentId: string | null = null
): string | null => {
  for (const layer of layers) {
    if (layer.id === layerId) return parentId;
    if ('children' in layer && layer.children?.length) {
      const found = findParentId(layer.children, layerId, layer.id);
      if (found !== null) return found;
    }
  }
  return null;
}; 