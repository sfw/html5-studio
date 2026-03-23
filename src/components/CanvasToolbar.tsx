import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Grid3X3, Magnet, Crosshair, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { CanvasControls } from '@/hooks/useCanvasControls';
import type { StageSize } from '@/types';

interface CanvasToolbarProps {
  controls: CanvasControls;
  stageSize: StageSize;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ controls, stageSize, containerRef }) => {
  const { zoom, showGrid, snapToGrid, smartGuides, setZoom, zoomIn, zoomOut, fitZoom, toggleGrid, toggleSnap, toggleGuides } = controls;
  const zoomPct = Math.round(zoom * 100);
  const selectValue = ZOOM_PRESETS.includes(zoom) ? String(zoom) : 'custom';

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-background shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={toggleGrid}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Toggle grid</p></TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={snapToGrid ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={toggleSnap}>
            <Magnet className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Snap to grid</p></TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={smartGuides ? 'secondary' : 'ghost'} size="icon" className="h-6 w-6" onClick={toggleGuides}>
            <Crosshair className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Smart guides</p></TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Zoom out (Ctrl+-)</p></TooltipContent>
      </Tooltip>

      <Select
        value={selectValue}
        onValueChange={(v) => { if (v !== 'custom') setZoom(parseFloat(v)); }}
      >
        <SelectTrigger className="h-6 w-[4.5rem] text-xs px-2">
          <SelectValue>{zoomPct}%</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ZOOM_PRESETS.map(z => (
            <SelectItem key={z} value={String(z)}>{Math.round(z * 100)}%</SelectItem>
          ))}
          {selectValue === 'custom' && (
            <SelectItem value="custom">{zoomPct}%</SelectItem>
          )}
        </SelectContent>
      </Select>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={zoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Zoom in (Ctrl+=)</p></TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fitZoom(stageSize, containerRef.current)}>
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Fit to window (Ctrl+0)</p></TooltipContent>
      </Tooltip>
    </div>
  );
};
