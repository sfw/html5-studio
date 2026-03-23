import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayerData, PropertyUpdateCallback, BlendMode } from '@/types/index';
import CommonLayerProperties from './CommonLayerProperties';
import ColorLayerProperties from './ColorLayerProperties';
import GradientLayerProperties from './GradientLayerProperties';
import ImageLayerProperties from './ImageLayerProperties';
import TextLayerProperties from './TextLayerProperties';
import GroupLayerProperties from './GroupLayerProperties';

interface LayerPanelProps {
  selectedLayer: LayerData;
  onUpdateLayerProperty: PropertyUpdateCallback;
  onDeleteLayer: (layerId: string) => void;
}

const blendModes: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light',
  'difference', 'exclusion'
];

const LayerPanel: React.FC<LayerPanelProps> = ({
  selectedLayer,
  onUpdateLayerProperty,
  onDeleteLayer,
}) => {

  const renderTypeSpecificProperties = () => {
    switch (selectedLayer.type) {
      case 'color':
        return <ColorLayerProperties selectedLayer={selectedLayer} onUpdateLayerProperty={onUpdateLayerProperty} />;
      case 'gradient':
        return <GradientLayerProperties selectedLayer={selectedLayer} onUpdateLayerProperty={onUpdateLayerProperty} />;
      case 'image':
        return <ImageLayerProperties selectedLayer={selectedLayer} onUpdateLayerProperty={onUpdateLayerProperty} />;
      case 'text':
        return <TextLayerProperties selectedLayer={selectedLayer} onUpdateLayerProperty={onUpdateLayerProperty} />;
      case 'group':
        return <GroupLayerProperties selectedLayer={selectedLayer} />;
      // Add cases for other types like 'mask' if they exist
      default:
        return <div className="text-xs text-muted-foreground pt-4 border-t border-border mt-4">No specific properties for this layer type.</div>;
    }
  };

  return (
    <div className="space-y-4">
      <CommonLayerProperties 
        selectedLayer={selectedLayer} 
        onUpdateLayerProperty={onUpdateLayerProperty} 
        onDeleteLayer={onDeleteLayer} 
      />
      {renderTypeSpecificProperties()}
      <div>
        <Label htmlFor={`blend-mode-${selectedLayer.id}`} className="text-xs">Blend Mode</Label>
        <Select
          value={selectedLayer.blendMode || 'normal'}
          onValueChange={(value) => onUpdateLayerProperty(selectedLayer.id, 'blendMode', value as BlendMode)}
        >
          <SelectTrigger id={`blend-mode-${selectedLayer.id}`} className="w-full h-9 text-xs">
            <SelectValue placeholder="Select blend mode" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map(mode => (
              <SelectItem key={mode} value={mode} className="text-xs">
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LayerPanel; 