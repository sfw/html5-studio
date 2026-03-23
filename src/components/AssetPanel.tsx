import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import type { AnimationScene, ImageLayerData } from '@/types/index';

interface AssetPanelProps {
  scenes: AnimationScene[];
  selectedLayerId: string | null;
  onUseAsset: (src: string) => void;
}

interface AssetEntry {
  src: string;
  name: string;
  usageCount: number;
}

const AssetPanel: React.FC<AssetPanelProps> = ({ scenes, selectedLayerId, onUseAsset }) => {
  const assets = useMemo<AssetEntry[]>(() => {
    const map = new Map<string, AssetEntry>();
    for (const scene of scenes) {
      for (const layer of scene.layers) {
        if (layer.type === 'image') {
          const imgLayer = layer as ImageLayerData;
          if (imgLayer.src) {
            const existing = map.get(imgLayer.src);
            if (existing) {
              existing.usageCount += 1;
            } else {
              map.set(imgLayer.src, {
                src: imgLayer.src,
                name: imgLayer.name || 'Image',
                usageCount: 1,
              });
            }
          }
        }
      }
    }
    return Array.from(map.values());
  }, [scenes]);

  if (assets.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>No images in project yet.</p>
        <p className="text-xs mt-1">Upload images to any image layer to see them here.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <p className="text-xs text-muted-foreground px-1 mb-2">{assets.length} unique image{assets.length !== 1 ? 's' : ''} across all scenes</p>
      <div className="grid grid-cols-3 gap-1.5">
        {assets.map((asset, i) => (
          <div key={i} className="group relative rounded border border-border overflow-hidden bg-muted/30 aspect-square flex items-center justify-center">
            <img
              src={asset.src}
              alt={asset.name}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
              <span className="text-white text-[10px] text-center truncate w-full px-1">{asset.name}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUseAsset(asset.src)}
                    disabled={!selectedLayerId}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selectedLayerId ? 'Use in selected layer' : 'Select a layer first'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetPanel;
