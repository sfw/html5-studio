import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Rewind, FastForward, Plus, Edit } from 'lucide-react';
import gsap from 'gsap';

function Timeline({ duration = 10, currentTime = 0, onTimeChange, onPlay, onPause, keyframes = [], onAddKeyframe, onEditKeyframe, selectedLayerId }: { duration?: number; currentTime?: number; onTimeChange?: (time: number) => void; onPlay?: () => void; onPause?: () => void; keyframes?: { time: number; x?: number; y?: number; opacity?: number; easing?: string }[]; onAddKeyframe?: (time: number) => void; onEditKeyframe?: (index: number) => void; selectedLayerId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0];
    if (onTimeChange) {
      onTimeChange(newTime);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      if (onPause) onPause();
    } else {
      if (onPlay) onPlay();
    }
  };

  const rewind = () => {
    if (onTimeChange) {
      onTimeChange(0);
    }
  };

  const fastForward = () => {
    if (onTimeChange) {
      onTimeChange(duration);
    }
  };

  const addKeyframe = () => {
    if (onAddKeyframe) {
      onAddKeyframe(currentTime);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      if (onTimeChange) {
        onTimeChange(Math.min(Math.max(newTime, 0), duration));
      }
    }
  };

  useEffect(() => {
    // Sync the play state with external changes if needed
    return () => {
      // Cleanup any GSAP animations if necessary
      gsap.killTweensOf('*');
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-2 p-4 bg-white shadow-md rounded-md">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={rewind} aria-label="Rewind to start">
          <Rewind className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={fastForward} aria-label="Fast forward to end">
          <FastForward className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{currentTime.toFixed(1)}s / {duration}s</span>
        {selectedLayerId && (
          <Button variant="outline" size="sm" onClick={addKeyframe} className="ml-auto">
            <Plus className="h-4 w-4 mr-1" /> Add Keyframe
          </Button>
        )}
      </div>
      <Slider
        value={[currentTime]}
        min={0}
        max={duration}
        step={0.1}
        onValueChange={handleTimeChange}
        className="w-full"
      />
      <div className="relative w-full h-12 mt-2 bg-gray-100 rounded cursor-pointer" ref={timelineRef} onClick={handleTimelineClick}>
        <div className="absolute h-full w-px bg-red-500" style={{ left: `${(currentTime / duration) * 100}%` }} />
        {keyframes.map((keyframe, index) => (
          <div 
            key={index} 
            className="absolute h-6 w-3 bg-blue-500 rounded cursor-pointer hover:bg-blue-700 transition-colors" 
            style={{ left: `${(keyframe.time / duration) * 100}%`, top: '3px' }} 
            onClick={(e) => {
              e.stopPropagation();
              if (onEditKeyframe) onEditKeyframe(index);
            }}
            title={`Time: ${keyframe.time}s | X: ${keyframe.x || 'N/A'} | Y: ${keyframe.y || 'N/A'} | Opacity: ${keyframe.opacity || 'N/A'}`}
          >
            <div className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center text-white text-xs">
              <Edit className="h-3 w-3" />
            </div>
          </div>
        ))}
        {/* Timeline ruler markings */}
        {Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
          <div key={i} className="absolute top-0 h-full w-px bg-gray-300" style={{ left: `${(i / duration) * 100}%` }}>
            <span className="absolute top-8 left-0 text-xs text-gray-500 transform -translate-x-1/2">{i}s</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">Timeline {selectedLayerId ? `(Layer: ${selectedLayerId})` : '(Select a layer to manage keyframes)'}</div>
    </div>
  );
}

export default Timeline; 