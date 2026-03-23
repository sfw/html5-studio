import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StageSize } from '@/types/index';
import { Label } from "@/components/ui/label";
import { Bookmark } from 'lucide-react';

interface StagePanelProps {
  stageSize: StageSize;
  totalDuration: number;
  fps: number;
  totalFrames: number;
  onSetStageSize: React.Dispatch<React.SetStateAction<StageSize>>;
  onSetTotalDuration: React.Dispatch<React.SetStateAction<number>>;
  onSetFps: React.Dispatch<React.SetStateAction<number>>;
  onSetGlobalLoop: (loop: boolean) => void;
  onSaveAsTemplate?: () => void;
}

const StagePanel: React.FC<StagePanelProps> = ({
  stageSize,
  totalDuration,
  fps,
  totalFrames,
  onSetStageSize,
  onSetTotalDuration,
  onSetFps,
  onSetGlobalLoop,
  onSaveAsTemplate,
}) => {
  return (
    <div className="space-y-4">
       {/* Canvas Size */}
       <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Canvas Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={stageSize.width}
              onChange={(e) => onSetStageSize((prev: StageSize) => ({ ...prev, width: parseInt(e.target.value) || 1 }))}
              min={1}
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={stageSize.height}
              onChange={(e) => onSetStageSize((prev: StageSize) => ({ ...prev, height: parseInt(e.target.value) || 1 }))}
              min={1}
            />
          </div>
        </div>
      </div>
      {/* Duration */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Duration (seconds)</Label>
        <Input
          type="number"
          value={totalDuration}
          onChange={(e) => onSetTotalDuration(parseFloat(e.target.value) || 1)}
          min={0.1}
          step={0.1}
        />
      </div>
      {/* FPS */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Frames Per Second (FPS)</Label>
        <Input
          type="number"
          value={fps}
          onChange={(e) => onSetFps(parseInt(e.target.value) || 1)}
          min={1}
          max={120}
        />
      </div>
      {/* Total Frames Info */}
      <div className="text-sm text-muted-foreground">
         Total Frames: {totalFrames - 1} (0 - {totalFrames - 1})
      </div>

      {/* Global Looping Controls */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs font-medium text-muted-foreground">Global Animation Looping</Label>
        <div className="flex space-x-2">
           <Button size="sm" variant="outline" onClick={() => onSetGlobalLoop(true)}>
             Set All to Loop
           </Button>
           <Button size="sm" variant="outline" onClick={() => onSetGlobalLoop(false)}>
             Set All Non-Looping
           </Button>
        </div>
        <p className="text-xs text-muted-foreground">This sets the loop property for all layer animations.</p>
      </div>

      {/* Save as Template */}
      {onSaveAsTemplate && (
        <div className="border-t pt-4">
          <Button variant="outline" size="sm" className="w-full" onClick={onSaveAsTemplate}>
            <Bookmark className="h-3.5 w-3.5 mr-2" />
            Save as Template
          </Button>
          <p className="text-xs text-muted-foreground mt-1">Save the current scene as a reusable template.</p>
        </div>
      )}
    </div>
  );
};

export default StagePanel;
