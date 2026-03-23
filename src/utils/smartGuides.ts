import { LayerData, GuideLines, SnapThreshold, SnapResult, LayerBounds } from '@/types/index';

const DEFAULT_SNAP_THRESHOLD: SnapThreshold = {
  position: 5, // pixels
  rotation: 5, // degrees
  sizing: 1    // pixels
};

export class SmartGuidesManager {
  private snapThreshold: SnapThreshold;

  constructor(threshold: Partial<SnapThreshold> = {}) {
    this.snapThreshold = { ...DEFAULT_SNAP_THRESHOLD, ...threshold };
  }

  private getLayerBounds(layer: LayerData): LayerBounds {
    return {
      left: layer.x,
      right: layer.x + layer.width,
      top: layer.y,
      bottom: layer.y + layer.height,
      centerX: layer.x + layer.width / 2,
      centerY: layer.y + layer.height / 2
    };
  }

  private findNearestValue(value: number, values: number[]): number | null {
    let nearest = null;
    let minDiff = Infinity;

    for (const v of values) {
      const diff = Math.abs(value - v);
      if (diff < this.snapThreshold.position && diff < minDiff) {
        nearest = v;
        minDiff = diff;
      }
    }

    return nearest;
  }

  public calculateSnapping(
    activeLayer: LayerData,
    otherLayers: LayerData[],
    canvasWidth: number,
    canvasHeight: number
  ): SnapResult {
    const activeBounds = this.getLayerBounds(activeLayer);
    const guides: GuideLines = {
      vertical: [],
      horizontal: []
    };

    // Collect all possible alignment positions
    const verticalPositions = new Set<number>();
    const horizontalPositions = new Set<number>();

    // Add canvas edges
    verticalPositions.add(0);
    verticalPositions.add(canvasWidth / 2);
    verticalPositions.add(canvasWidth);
    horizontalPositions.add(0);
    horizontalPositions.add(canvasHeight / 2);
    horizontalPositions.add(canvasHeight);

    // Add other layers' alignment points
    otherLayers.forEach(layer => {
      const bounds = this.getLayerBounds(layer);
      verticalPositions.add(bounds.left);
      verticalPositions.add(bounds.centerX);
      verticalPositions.add(bounds.right);
      horizontalPositions.add(bounds.top);
      horizontalPositions.add(bounds.centerY);
      horizontalPositions.add(bounds.bottom);
    });

    // Find nearest snap positions
    const snapX = this.findNearestValue(activeBounds.centerX, Array.from(verticalPositions));
    const snapY = this.findNearestValue(activeBounds.centerY, Array.from(horizontalPositions));

    let newX = activeLayer.x;
    let newY = activeLayer.y;

    if (snapX !== null) {
      newX = snapX - activeLayer.width / 2;
      guides.vertical.push(snapX);
    }

    if (snapY !== null) {
      newY = snapY - activeLayer.height / 2;
      guides.horizontal.push(snapY);
    }

    return { x: newX, y: newY, guides };
  }

  public calculateRotationSnap(rotation: number): number {
    const commonAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    let snappedRotation = rotation;
    let minDiff = this.snapThreshold.rotation;

    commonAngles.forEach(angle => {
      const diff = Math.abs(rotation % 360 - angle);
      if (diff < minDiff) {
        snappedRotation = angle;
        minDiff = diff;
      }
    });

    return snappedRotation;
  }

  public calculateSizeSnap(size: number): number {
    // Snap to whole pixels
    if (Math.abs(Math.round(size) - size) < this.snapThreshold.sizing) {
      return Math.round(size);
    }
    return size;
  }

  public getGuideLines(
    activeLayer: LayerData,
    otherLayers: LayerData[],
    canvasWidth: number,
    canvasHeight: number
  ): GuideLines {
    const { guides } = this.calculateSnapping(
      activeLayer,
      otherLayers,
      canvasWidth,
      canvasHeight
    );
    return guides;
  }
} 