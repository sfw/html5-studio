import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Image, Group as KonvaGroup, Transformer } from 'react-konva';
import type {
  LayerData,
  TextLayerData,
  GroupLayerData,
  CanvasAreaProps,
} from '@/types/index';
import InlineTextEditor from './InlineTextEditor';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Node, NodeConfig } from 'konva/lib/Node';
import { RectConfig } from 'konva/lib/shapes/Rect';
import KonvaTextNode from './KonvaTextNode';
import { calculateLayerProps } from '@/utils/animation';
import { SmartGuidesManager } from '@/utils/smartGuides';
import type { GuideLines } from '@/types/index';
import type { CanvasControls } from '@/hooks/useCanvasControls';

const CANVAS_PADDING = 400;
const guidesManager = new SmartGuidesManager();

interface CanvasAreaPropsExtended extends CanvasAreaProps {
  canvasControls: CanvasControls;
  onWheelZoom: (delta: number) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const CanvasArea: React.FC<CanvasAreaPropsExtended> = ({
  layers,
  animations,
  currentFrame,
  totalFrames,
  stageSize,
  selectedLayerId,
  images,
  stageRef,
  onLayerSelect,
  onDragEnd,
  onStageClick: handleStageClick,
  onLayerTransformEnd,
  onUpdateLayerProperty,
  canvasControls,
  onWheelZoom,
  scrollContainerRef: externalScrollRef,
}) => {
  const { zoom, showGrid, gridSize, snapToGrid, smartGuides } = canvasControls;
  const transformerRef = useRef<Konva.Transformer>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalScrollRef ?? internalScrollRef;
  const [editingTextLayer, setEditingTextLayer] = useState<LayerData | null>(null);
  const [guides, setGuides] = useState<GuideLines>({ vertical: [], horizontal: [] });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const canvasWidth = stageSize.width + 2 * CANVAS_PADDING;
  const canvasHeight = stageSize.height + 2 * CANVAS_PADDING;

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr || !stageRef.current) return;

    const stage = stageRef.current;
    if (selectedLayerId) {
      const shape = stage.findOne('#' + selectedLayerId);
      const layerData = layers.find(l => l.id === selectedLayerId);

      if (shape && layerData && !layerData.locked) {
        tr.nodes([shape]);
        if (layerData.type === 'text') {
          tr.resizeEnabled(true);
          tr.rotateEnabled(false);
        } else if (layerData.type === 'image' && layerData.src) {
          tr.resizeEnabled(true);
          tr.rotateEnabled(true);
          tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
          tr.keepRatio(true);
        } else {
          tr.resizeEnabled(true);
          tr.rotateEnabled(true);
          tr.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']);
          tr.keepRatio(false);
        }
      } else {
        tr.nodes([]);
      }
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedLayerId, stageRef, layers]);

  const handleTextEditSave = (newValue: string) => {
    if (editingTextLayer) {
      onUpdateLayerProperty(editingTextLayer.id, 'content', newValue);
      const textNode = stageRef.current?.findOne('#' + editingTextLayer.id);
      textNode?.show();
      transformerRef.current?.show();
      setEditingTextLayer(null);
      textNode?.getLayer()?.batchDraw();
    }
  };

  const handleTextEditCancel = () => {
    if (editingTextLayer) {
      const textNode = stageRef.current?.findOne('#' + editingTextLayer.id);
      textNode?.show();
      transformerRef.current?.show();
      setEditingTextLayer(null);
      textNode?.getLayer()?.batchDraw();
    }
  };

  const internalStageClickHandler = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'stage-boundary';
    if (clickedOnEmpty) {
      handleStageClick(e);
    } else {
      const clickedId = e.target.id();
      if (clickedId && clickedId !== selectedLayerId) {
        onLayerSelect(clickedId);
      }
    }
  };

  // Re-centre when zoom changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollLeft = Math.max(0, (canvasWidth * zoom - container.clientWidth) / 2);
    container.scrollTop = Math.max(0, (canvasHeight * zoom - container.clientHeight) / 2);
  }, [zoom, canvasWidth, canvasHeight, scrollContainerRef]);

  // Ctrl+wheel → zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onWheelZoom(e.deltaY);
    }
  }, [onWheelZoom]);

  const interpolatedLayers = layers.map(layer => {
    const animation = animations.find(a => a.layerId === layer.id);
    return calculateLayerProps(layer, animation, currentFrame, totalFrames);
  });

  const renderLayer = (layer: LayerData) => {
    const isSelected = layer.id === selectedLayerId;
    const layerProps: NodeConfig = {
      id: layer.id,
      name: layer.name,
      ref: React.createRef<Node>(),
      x: layer.x + CANVAS_PADDING,
      y: layer.y + CANVAS_PADDING,
      width: layer.width ?? 100,
      height: layer.height ?? 30,
      draggable: !layer.locked,
      globalCompositeOperation: layer.blendMode === 'normal' ? 'source-over' : layer.blendMode,
      onDragMove: smartGuides ? (e: KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const currentX = node.x() - CANVAS_PADDING;
        const currentY = node.y() - CANVAS_PADDING;
        const activeLayerForGuides: LayerData = { ...layer, x: currentX, y: currentY };
        const otherLayers = layers.filter(l => l.id !== layer.id && l.visible !== false);
        const result = guidesManager.calculateSnapping(
          activeLayerForGuides,
          otherLayers,
          stageSize.width,
          stageSize.height
        );
        setGuides(result.guides);
      } : undefined,
      onDragEnd: (e: KonvaEventObject<DragEvent>) => {
        setGuides({ vertical: [], horizontal: [] });
        const target = e.target;
        let newX = target.x() - CANVAS_PADDING;
        let newY = target.y() - CANVAS_PADDING;

        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
          target.x(newX + CANVAS_PADDING);
          target.y(newY + CANVAS_PADDING);
        } else if (smartGuides) {
          const activeLayerForSnap: LayerData = { ...layer, x: newX, y: newY };
          const otherLayers = layers.filter(l => l.id !== layer.id && l.visible !== false);
          const result = guidesManager.calculateSnapping(
            activeLayerForSnap,
            otherLayers,
            stageSize.width,
            stageSize.height
          );
          newX = result.x;
          newY = result.y;
          target.x(newX + CANVAS_PADDING);
          target.y(newY + CANVAS_PADDING);
        }

        onDragEnd(layer.id, newX, newY);
      },
      opacity: layer.opacity ?? 1,
      rotation: layer.rotation ?? 0,
      scaleX: layer.scaleX ?? 1,
      scaleY: layer.scaleY ?? 1,
      stroke: isSelected ? '#0ea5e9' : undefined,
      strokeWidth: isSelected ? 2 : 0,
      visible: layer.visible,
      onTransformEnd: (e: KonvaEventObject<Node>) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        const newProps = {
          x: node.x() - CANVAS_PADDING,
          y: node.y() - CANVAS_PADDING,
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation()
        };
        onLayerTransformEnd(node.id(), newProps);
      },
    };

    if (isSelected) {
      delete layerProps.stroke;
      delete layerProps.strokeWidth;
    }

    let imageElement = null;
    let textProps = null;
    let element;

    switch (layer.type) {
      case 'color':
        element = <Rect key={layer.id} {...layerProps} fill={layer.fill} />;
        break;
      case 'gradient': {
        const gradientLayer = layer as import('@/types/index').GradientLayerData;
        const grad = gradientLayer.gradient;
        const colorStops: (string | number)[] = grad.stops.flatMap(stop => [stop.position, stop.color]);
        let gradientProps: Partial<RectConfig> = {};
        if (grad.type === 'linear') {
          gradientProps = {
            fillLinearGradientColorStops: colorStops,
            fillLinearGradientStartPoint: { x: (grad.start?.x ?? 0.5) * layer.width, y: (grad.start?.y ?? 0) * layer.height },
            fillLinearGradientEndPoint: { x: (grad.end?.x ?? 0.5) * layer.width, y: (grad.end?.y ?? 1) * layer.height }
          };
        } else {
          const smallestDimension = Math.min(layer.width, layer.height);
          gradientProps = {
            fillRadialGradientColorStops: colorStops,
            fillRadialGradientStartPoint: { x: (grad.center?.x ?? 0.5) * layer.width, y: (grad.center?.y ?? 0.5) * layer.height },
            fillRadialGradientEndPoint: { x: (grad.center?.x ?? 0.5) * layer.width, y: (grad.center?.y ?? 0.5) * layer.height },
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndRadius: (grad.radius ?? 0.5) * smallestDimension
          };
        }
        element = <Rect key={layer.id} {...layerProps} {...gradientProps} />;
        break;
      }
      case 'image':
        console.log(`CanvasArea - Rendering layer ${layer.id}, src: ${layer.src}, lookup result:`, images[layer.src]);
        imageElement = layer.src && images[layer.src] ? images[layer.src] : null;
        if (imageElement) {
          element = <Image key={layer.id} {...layerProps} image={imageElement} />;
        } else {
          element = <Rect key={layer.id} {...layerProps} fill="#e0e0e0" stroke="#a0a0a0" strokeWidth={1} dash={[4, 4]} />;
        }
        break;
      case 'text':
        textProps = {
          ...layerProps,
          visible: layer.visible && editingTextLayer?.id !== layer.id,
          onDblClick: (e: KonvaEventObject<Node>) => {
            const node = e.target;
            const currentLayerData = interpolatedLayers.find(l => l.id === layer.id);
            if (!currentLayerData || currentLayerData.type !== 'text') return;
            node.hide();
            transformerRef.current?.hide();
            setEditingTextLayer(currentLayerData);
            node.getLayer()?.batchDraw();
          }
        };
        element = (
          <KonvaTextNode
            key={layer.id}
            layer={layer as TextLayerData}
            elementProps={textProps}
          />
        );
        break;
      case 'group': {
        const groupLayer = layer as GroupLayerData;
        const childElements = (groupLayer.children || [])
          .filter(child => child.visible)
          .map(child => {
            const childAnim = animations.find(a => a.layerId === child.id);
            return renderLayer(calculateLayerProps(child, childAnim, currentFrame, totalFrames));
          });
        return (
          <React.Fragment key={layer.id}>
            <KonvaGroup {...layerProps}>
              <Rect
                width={layer.width ?? 100}
                height={layer.height ?? 30}
                stroke={isSelected ? '#0ea5e9' : '#888888'}
                strokeWidth={isSelected ? 2 : 1}
                dash={isSelected ? undefined : [5, 5]}
                fill="transparent"
                listening={false}
              />
            </KonvaGroup>
            {childElements}
          </React.Fragment>
        );
      }
      default:
        console.warn(`Unknown layer type encountered: ${layer.type}`);
        element = null;
    }
    return element;
  };

  // Grid lines (drawn in stage coordinates, before zoom)
  const gridLines = showGrid ? (() => {
    const lines: React.ReactElement[] = [];
    const cols = Math.ceil(stageSize.width / gridSize);
    const rows = Math.ceil(stageSize.height / gridSize);
    for (let i = 0; i <= cols; i++) {
      lines.push(
        <Line key={`v${i}`} points={[CANVAS_PADDING + i * gridSize, CANVAS_PADDING, CANVAS_PADDING + i * gridSize, CANVAS_PADDING + stageSize.height]}
          stroke="rgba(128,128,128,0.15)" strokeWidth={1} listening={false} />
      );
    }
    for (let i = 0; i <= rows; i++) {
      lines.push(
        <Line key={`h${i}`} points={[CANVAS_PADDING, CANVAS_PADDING + i * gridSize, CANVAS_PADDING + stageSize.width, CANVAS_PADDING + i * gridSize]}
          stroke="rgba(128,128,128,0.15)" strokeWidth={1} listening={false} />
      );
    }
    return lines;
  })() : [];

  // Smart guide lines
  const guideLines = [
    ...guides.vertical.map((x, i) => (
      <Line key={`gv${i}`} points={[CANVAS_PADDING + x, CANVAS_PADDING, CANVAS_PADDING + x, CANVAS_PADDING + stageSize.height]}
        stroke="#f97316" strokeWidth={1} listening={false} />
    )),
    ...guides.horizontal.map((y, i) => (
      <Line key={`gh${i}`} points={[CANVAS_PADDING, CANVAS_PADDING + y, CANVAS_PADDING + stageSize.width, CANVAS_PADDING + y]}
        stroke="#f97316" strokeWidth={1} listening={false} />
    )),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 bg-muted/30 rounded-md overflow-auto"
        onWheel={handleWheel}
        onMouseMove={(e) => {
          if (!stageRef.current) return;
          const stageBox = stageRef.current.container().getBoundingClientRect();
          const x = Math.round((e.clientX - stageBox.left) / zoom - CANVAS_PADDING);
          const y = Math.round((e.clientY - stageBox.top) / zoom - CANVAS_PADDING);
          if (x >= 0 && x <= stageSize.width && y >= 0 && y <= stageSize.height) {
            setCursorPos({ x, y });
          } else {
            setCursorPos(null);
          }
        }}
        onMouseLeave={() => setCursorPos(null)}
      >
        <div style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
          <Stage
            width={canvasWidth * zoom}
            height={canvasHeight * zoom}
            scaleX={zoom}
            scaleY={zoom}
            ref={stageRef}
            className="canvas-stage"
            onClick={internalStageClickHandler}
          >
            <Layer>
              {/* Stage boundary */}
              <Rect
                name="stage-boundary"
                x={CANVAS_PADDING}
                y={CANVAS_PADDING}
                width={stageSize.width}
                height={stageSize.height}
                fill="#f9f9f9"
                stroke="#cccccc"
                strokeWidth={1}
                listening={false}
              />

              {/* Grid overlay */}
              {gridLines}

              {/* Content layers */}
              {interpolatedLayers.map(layer => {
                if (!layer.visible) return null;
                return renderLayer(layer);
              })}

              {/* Smart guide lines */}
              {guideLines}

              {/* Transformer */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(_oldBox, newBox) => newBox}
                keepRatio={false}
                ignoreStroke={true}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  const finalWidth = node.width() * scaleX;
                  const finalHeight = node.height() * scaleY;
                  const updateProps: Partial<LayerData> = {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, finalWidth),
                    height: Math.max(5, finalHeight),
                    rotation: node.rotation()
                  };
                  onLayerTransformEnd(node.id(), updateProps);
                }}
              />
            </Layer>
          </Stage>
        </div>

        {/* Inline text editor */}
        {editingTextLayer && editingTextLayer.type === 'text' && (
          <InlineTextEditor
            x={editingTextLayer.x + CANVAS_PADDING + (stageRef.current?.container().getBoundingClientRect().left || 0)}
            y={editingTextLayer.y + CANVAS_PADDING + (stageRef.current?.container().getBoundingClientRect().top || 0)}
            width={editingTextLayer.width}
            height={editingTextLayer.height}
            fontSize={editingTextLayer.font.size}
            fontFamily={editingTextLayer.font.family}
            fill={editingTextLayer.fill}
            initialValue={editingTextLayer.content}
            onSave={handleTextEditSave}
            onCancel={handleTextEditCancel}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-0.5 text-xs text-muted-foreground border-t border-border bg-background shrink-0">
        {cursorPos
          ? <span>Position: {cursorPos.x}, {cursorPos.y}</span>
          : <span>Position: —</span>
        }
        <span className="ml-auto">{stageSize.width} × {stageSize.height}px</span>
      </div>
    </div>
  );
};

export default CanvasArea;
