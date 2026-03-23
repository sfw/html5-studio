import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Square,
  Layers as LayersIcon,
  ImageIcon,
  Type as TypeIcon,
  Folder,
  Link,
  Unlink,
} from 'lucide-react';
import { LayerData, LayerProperty, LayerPropertyValue, BlendMode } from '@/types/index';

const BLEND_MODES: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
];

interface CommonLayerPropertiesProps {
  selectedLayer: LayerData;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
  onDeleteLayer: (layerId: string) => void;
}

const CommonLayerProperties: React.FC<CommonLayerPropertiesProps> = ({
  selectedLayer,
  onUpdateLayerProperty
}) => {
  const opacity = selectedLayer.opacity ?? 1;
  const [linked, setLinked] = useState(true);

  const handleWidthChange = (raw: string) => {
    const w = parseFloat(raw);
    if (isNaN(w) || w <= 0) return;
    onUpdateLayerProperty(selectedLayer.id, 'width', w);
    if (linked && (selectedLayer.width ?? 0) > 0) {
      const ratio = (selectedLayer.height ?? 0) / (selectedLayer.width ?? 1);
      onUpdateLayerProperty(selectedLayer.id, 'height', Math.round(w * ratio));
    }
  };

  const handleHeightChange = (raw: string) => {
    const h = parseFloat(raw);
    if (isNaN(h) || h <= 0) return;
    onUpdateLayerProperty(selectedLayer.id, 'height', h);
    if (linked && (selectedLayer.height ?? 0) > 0) {
      const ratio = (selectedLayer.width ?? 0) / (selectedLayer.height ?? 1);
      onUpdateLayerProperty(selectedLayer.id, 'width', Math.round(h * ratio));
    }
  };

  return (
    <div className="space-y-4">
      {/* Name row */}
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0" title={`Layer Type: ${selectedLayer.type}`}>
          {(() => {
            const iconProps = { className: "h-5 w-5 text-muted-foreground", strokeWidth: 1.5 };
            switch (selectedLayer.type) {
              case 'color': return <Square {...iconProps} />;
              case 'gradient': return <LayersIcon {...iconProps} />;
              case 'image': return <ImageIcon {...iconProps} />;
              case 'text': return <TypeIcon {...iconProps} />;
              case 'group': return <Folder {...iconProps} />;
              default: return null;
            }
          })()}
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground sr-only">Layer Name</label>
          <Input
            value={selectedLayer.name}
            onChange={(e) => onUpdateLayerProperty(selectedLayer.id, 'name', e.target.value)}
            placeholder="Layer Name"
            className="text-sm"
          />
        </div>
      </div>

      {/* Position & Size */}
      <div className="space-y-2">
        {/* X / Y */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">X</label>
            <Input
              type="number"
              value={Math.round(selectedLayer.x ?? 0)}
              onChange={(e) => onUpdateLayerProperty(selectedLayer.id, 'x', parseFloat(e.target.value) || 0)}
              className="mt-1 text-xs h-7"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Y</label>
            <Input
              type="number"
              value={Math.round(selectedLayer.y ?? 0)}
              onChange={(e) => onUpdateLayerProperty(selectedLayer.id, 'y', parseFloat(e.target.value) || 0)}
              className="mt-1 text-xs h-7"
            />
          </div>
        </div>
        {/* W / H with link toggle */}
        <div className="flex items-end gap-1">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">W</label>
            <Input
              type="number"
              value={Math.round(selectedLayer.width ?? 0)}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="mt-1 text-xs h-7"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 mb-0.5 shrink-0"
            onClick={() => setLinked(l => !l)}
            title={linked ? 'Unlink proportions' : 'Link proportions'}
          >
            {linked ? <Link className="h-3.5 w-3.5 text-primary" /> : <Unlink className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">H</label>
            <Input
              type="number"
              value={Math.round(selectedLayer.height ?? 0)}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="mt-1 text-xs h-7"
            />
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Opacity</label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            min={0} max={100} step={1}
            value={[Math.round(opacity * 100)]}
            onValueChange={([v]) => onUpdateLayerProperty(selectedLayer.id, 'opacity', v / 100)}
            className="flex-1"
          />
          <Input
            type="number" min={0} max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => onUpdateLayerProperty(selectedLayer.id, 'opacity', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)}
            className="w-14 text-right text-xs"
          />
          <span className="text-xs text-muted-foreground shrink-0">%</span>
        </div>
      </div>

      {/* Blend Mode */}
      {selectedLayer.type !== 'group' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Blend Mode</label>
          <Select
            value={selectedLayer.blendMode ?? 'normal'}
            onValueChange={(v) => onUpdateLayerProperty(selectedLayer.id, 'blendMode', v as BlendMode)}
          >
            <SelectTrigger className="mt-1 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLEND_MODES.map(m => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default CommonLayerProperties; 