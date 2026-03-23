import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayerData, AnimationData, Keyframe, LayerProperty, LayerPropertyValue } from '@/types/index';
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from 'gsap';

// Small SVG preview of an easing curve, sampled at N points
function EasingCurvePreview({ easing }: { easing: string }) {
  const N = 40;
  let easeFn: ((t: number) => number) | null = null;
  try { easeFn = gsap.parseEase(easing); } catch { /* unknown easing, skip */ }
  if (!easeFn) return null;

  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    return [t, 1 - (easeFn as (t: number) => number)(t)] as [number, number];
  });
  const d = 'M ' + pts.map(([x, y]) => `${(x * 32).toFixed(1)},${(y * 32).toFixed(1)}`).join(' L ');

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0 opacity-60 text-foreground">
      <path d={d} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

interface AnimationPanelProps {
  selectedLayer: LayerData | null;
  animations: AnimationData[];
  currentFrame: number;
  selectedKeyframe: { layerId: string; index: number } | null;
  editingKeyframe: { layerId: string; index: number } | null;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
  onUpdateKeyframe: (layerId: string, keyframeIndex: number, updates: Partial<Keyframe>) => void;
  onSetKeyframeProperty: (layerId: string, property: LayerProperty, value: number | string) => void;
  onDeleteKeyframe: (layerId: string, index: number) => void;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({
  selectedLayer,
  animations,
  currentFrame,
  selectedKeyframe,
  onUpdateKeyframe,
  onSetKeyframeProperty,
  onDeleteKeyframe,
}) => {

  // State for easing popover
  const [easingPopoverOpen, setEasingPopoverOpen] = React.useState(false);
  const [easingSearchTerm, setEasingSearchTerm] = React.useState("");

  // Comprehensive list of parameter-less GSAP v3 easing strings
  const gsapEasings = [
    'none', 'linear',
    'power1.in', 'power1.out', 'power1.inOut',
    'power2.in', 'power2.out', 'power2.inOut', // Quad
    'power3.in', 'power3.out', 'power3.inOut', // Cubic
    'power4.in', 'power4.out', 'power4.inOut', // Quart
    'sine.in', 'sine.out', 'sine.inOut',
    'expo.in', 'expo.out', 'expo.inOut',
    'circ.in', 'circ.out', 'circ.inOut',
    'back.in', 'back.out', 'back.inOut', // Common parameter-less versions
    'elastic.in', 'elastic.out', 'elastic.inOut', // Common parameter-less versions
    'bounce.in', 'bounce.out', 'bounce.inOut',
  ].sort();

  // Find the current animation data for the selected layer
  const selectedAnimation = selectedLayer ? animations.find(a => a.layerId === selectedLayer.id) : null;
  
  // Get the actual keyframe object being edited (if any)
  const currentKeyframeData = selectedKeyframe && selectedAnimation
    ? selectedAnimation.keyframes[selectedKeyframe.index]
    : null;

  // Find the *previous* keyframe based on currentFrame for displaying context
  const previousKeyframeData = selectedLayer && selectedAnimation ? selectedAnimation.keyframes
    .filter((kf: Keyframe) => kf.frame < currentFrame)
    .sort((a: Keyframe, b: Keyframe) => b.frame - a.frame)[0] : null;

  // Get the *effective* values for the layer at the current frame (could be from layer base or interpolated)
  // This is primarily for displaying the *current* state when *not* on an exact keyframe
  const currentLayerState = selectedLayer; // Use the interpolated layer state passed in selectedLayer prop

  // Helper to get the value to display in an input
  // Prefers the edited keyframe value, falls back to current interpolated layer state
  const getDisplayValue = (prop: keyof Keyframe | keyof LayerData, defaultValue: number | string) => {
    if (currentKeyframeData && currentKeyframeData[prop as keyof Keyframe] !== undefined) {
      return currentKeyframeData[prop as keyof Keyframe];
    } 
    if (currentLayerState && currentLayerState[prop as keyof LayerData] !== undefined) {
      return currentLayerState[prop as keyof LayerData];
    }
    return defaultValue;
  };

  // Find the animation data for the selected layer
  const layerAnimation = animations.find(anim => anim.layerId === selectedLayer?.id);
  
  // Find the keyframe at the current frame for the selected layer, if one exists
  const activeKeyframe = layerAnimation?.keyframes.find(kf => kf.frame === currentFrame);

 
  // Handler for changing keyframe properties via inputs
  const handleKeyframePropChange = (prop: keyof Keyframe, value: string) => {
    if (!selectedLayer) return;
    // Try parsing as float, fallback to original string if NaN (for non-numeric props potentially)
    const numericValue = parseFloat(value);
    // Cast `prop` (keyof Keyframe) to `LayerProperty` before calling
    onSetKeyframeProperty(selectedLayer.id, prop as LayerProperty, isNaN(numericValue) ? value : numericValue);
  };


  if (!selectedLayer) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Select a layer to edit its animation properties.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Current Frame: {currentFrame}
      </div>
      
      {/* Previous Keyframe Values (Read Only for Context) */}
      {previousKeyframeData && (
        <div className="space-y-2 opacity-50">
          <div className="text-xs font-medium text-muted-foreground">Previous Keyframe (Frame {previousKeyframeData.frame})</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">X</label>
              <Input type="number" value={previousKeyframeData.x ?? '-'} readOnly disabled />
            </div>
            <div>
              <label className="text-xs">Y</label>
              <Input type="number" value={previousKeyframeData.y ?? '-'} readOnly disabled />
            </div>
            <div>
              <label className="text-xs">W</label>
              <Input type="number" value={previousKeyframeData.width ?? '-'} readOnly disabled />
            </div>
            <div>
              <label className="text-xs">H</label>
              <Input type="number" value={previousKeyframeData.height ?? '-'} readOnly disabled />
            </div>
          </div>
          <div>
            <label className="text-xs">Opacity</label>
            <Input 
              type="number" 
              value={previousKeyframeData.opacity ?? '-'} 
              readOnly 
              disabled
            />
          </div>
          {/* Add other relevant properties like rotation if needed */}
        </div>
      )}

      {/* Current Values / Keyframe Editor */}
      <div className="space-y-2 border-t border-border pt-4 mt-4">
         <div className="text-xs font-medium text-muted-foreground">
            {currentKeyframeData ? `Editing Keyframe @ ${currentKeyframeData.frame}` : `Current Values @ ${currentFrame}`}
            {!currentKeyframeData && selectedAnimation && 
             !selectedAnimation.keyframes.find((kf: Keyframe) => kf.frame === currentFrame) && 
             ' (No keyframe at this frame)'}
        </div>
        {/* Always show current values, enable editing if on a keyframe */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs">X</label>
            <Input 
              type="number" 
              value={getDisplayValue('x', 0) as number}
              onChange={(e) => onSetKeyframeProperty(selectedLayer.id, 'x', parseFloat(e.target.value) || 0)} 
              // disabled={!currentKeyframeData} // Allow updating layer directly, will create keyframe if needed
            />
          </div>
          <div>
            <label className="text-xs">Y</label>
            <Input 
              type="number" 
              value={getDisplayValue('y', 0) as number}
              onChange={(e) => onSetKeyframeProperty(selectedLayer.id, 'y', parseFloat(e.target.value) || 0)} 
              // disabled={!currentKeyframeData}
            />
          </div>
           <div>
            <label className="text-xs">Width</label>
            <Input 
              type="number" 
              value={getDisplayValue('width', 100) as number}
              min={1}
              onChange={(e) => onSetKeyframeProperty(selectedLayer.id, 'width', parseFloat(e.target.value) || 1)} 
              // disabled={!currentKeyframeData}
            />
          </div>
          <div>
            <label className="text-xs">Height</label>
            <Input 
              type="number" 
              value={getDisplayValue('height', 100) as number}
              min={1}
              onChange={(e) => onSetKeyframeProperty(selectedLayer.id, 'height', parseFloat(e.target.value) || 1)} 
              // disabled={!currentKeyframeData}
            />
          </div>
        </div>
        <div>
          <label className="text-xs">Opacity</label>
          <Input 
            type="number" 
            min="0" max="1" step="0.01"
            value={getDisplayValue('opacity', 1) as number}
            onChange={(e) => onSetKeyframeProperty(selectedLayer.id, 'opacity', parseFloat(e.target.value) || 0)} 
            // disabled={!currentKeyframeData}
          />
        </div>
        {/* Easing - Only enable if a keyframe is selected */}
        <div>
          <label className="text-xs">Easing (Applies to interval starting here)</label>
          <Popover open={easingPopoverOpen} onOpenChange={setEasingPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={easingPopoverOpen}
                className="w-full justify-between font-normal text-xs h-9"
                disabled={!currentKeyframeData} // Disable if no keyframe selected
              >
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  {currentKeyframeData?.easing && <EasingCurvePreview easing={currentKeyframeData.easing} />}
                  <span className="truncate">{currentKeyframeData?.easing || "Select easing..."}</span>
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput 
                  placeholder="Search easing..." 
                  value={easingSearchTerm}
                  onValueChange={setEasingSearchTerm}
                />
                <CommandList>
                  <ScrollArea className="h-[250px]">
                    <CommandEmpty>No easing found.</CommandEmpty>
                    <CommandGroup>
                      {gsapEasings
                        .filter(ease => ease.toLowerCase().includes(easingSearchTerm.toLowerCase()))
                        .map((ease) => (
                          <CommandItem
                            key={ease}
                            value={ease}
                            onSelect={() => {
                              if (currentKeyframeData && selectedKeyframe) {
                                onUpdateKeyframe(selectedLayer.id, selectedKeyframe.index, { easing: ease });
                                setEasingPopoverOpen(false);
                                setEasingSearchTerm("");
                              }
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4 shrink-0", currentKeyframeData?.easing === ease ? "opacity-100" : "opacity-0")} />
                            <span className="flex-1">{ease}</span>
                            <EasingCurvePreview easing={ease} />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* Delete Keyframe Button - Only enable if a keyframe is selected */}
        {currentKeyframeData && (
          <div className="pt-4 border-t border-border mt-4">
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full"
              // Ensure selectedKeyframe is not null before calling
              onClick={() => selectedKeyframe && onDeleteKeyframe(selectedLayer.id, selectedKeyframe.index)}
              disabled={!selectedKeyframe} // Double check disable condition
            >
              <Trash2 className="h-4 w-4 mr-2" />Delete Keyframe @ {currentKeyframeData.frame}
            </Button>
          </div>
        )}
      </div>

      {/* Rotation Input - Reverted to match original panel style */}
      <div>
        <label className="text-xs mb-1 block">Rotation</label>
        <Input id="kf-rotation" type="number" value={activeKeyframe?.rotation ?? selectedLayer?.rotation ?? 0} step="1" onChange={(e) => handleKeyframePropChange('rotation', e.target.value)} />
      </div>

      {/* Scale X/Y Inputs - Reverted to match original panel style */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs mb-1 block">Scale X</label>
          <Input id="kf-scaleX" type="number" value={activeKeyframe?.scaleX ?? selectedLayer?.scaleX ?? 1} step="0.1" onChange={(e) => handleKeyframePropChange('scaleX', e.target.value)} />
        </div>
        <div>
          <label className="text-xs mb-1 block">Scale Y</label>
          <Input id="kf-scaleY" type="number" value={activeKeyframe?.scaleY ?? selectedLayer?.scaleY ?? 1} step="0.1" onChange={(e) => handleKeyframePropChange('scaleY', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

export default AnimationPanel; 