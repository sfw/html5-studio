import { useState, useCallback, useEffect } from 'react';
import { StageSize } from '@/types';

const ZOOM_STEP = 0.25;

export interface CanvasControls {
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  smartGuides: boolean;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitZoom: (stageSize: StageSize, containerEl: HTMLElement | null) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleGuides: () => void;
}

export function useCanvasControls(): CanvasControls {
  const [zoom, setZoomRaw] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize] = useState(8);
  const [smartGuides, setSmartGuides] = useState(true);

  const setZoom = useCallback((z: number) => {
    setZoomRaw(Math.min(4, Math.max(0.1, parseFloat(z.toFixed(2)))));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomRaw(z => Math.min(4, parseFloat((z + ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomRaw(z => Math.max(0.1, parseFloat((z - ZOOM_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => setZoomRaw(1), []);

  const fitZoom = useCallback((stageSize: StageSize, containerEl: HTMLElement | null) => {
    if (!containerEl) return;
    const padding = 80;
    const sx = (containerEl.clientWidth - padding) / stageSize.width;
    const sy = (containerEl.clientHeight - padding) / stageSize.height;
    setZoom(Math.min(sx, sy, 2));
  }, [setZoom]);

  const toggleGrid = useCallback(() => setShowGrid(v => !v), []);
  const toggleSnap = useCallback(() => setSnapToGrid(v => !v), []);
  const toggleGuides = useCallback(() => setSmartGuides(v => !v), []);

  // Keyboard shortcuts: Ctrl+0 (reset), Ctrl+= (zoom in), Ctrl+- (zoom out)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === '0') { e.preventDefault(); resetZoom(); }
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetZoom, zoomIn, zoomOut]);

  return { zoom, showGrid, snapToGrid, gridSize, smartGuides, setZoom, zoomIn, zoomOut, resetZoom, fitZoom, toggleGrid, toggleSnap, toggleGuides };
}
