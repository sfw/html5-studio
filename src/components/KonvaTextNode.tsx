import React, { useRef } from 'react';
import { Text as KonvaText } from 'react-konva';
import type { TextLayerData } from '@/types/index';
import type { NodeConfig } from 'konva/lib/Node';
import Konva from 'konva';

interface KonvaTextNodeProps {
  layer: TextLayerData;
  elementProps: NodeConfig; // Base props like x, y, draggable, etc.
  // Add any other specific props needed only by Text, if any
}

const KonvaTextNode: React.FC<KonvaTextNodeProps> = ({
  layer,
  elementProps,
}) => {
  const textNodeRef = useRef<Konva.Text>(null);

  const shadow = layer.effects?.shadow;
  const stroke = layer.effects?.stroke;

  return (
    <KonvaText
      ref={textNodeRef}
      key={layer.id}
      {...elementProps}
      perfectDrawEnabled={true}
      width={typeof elementProps.width === 'number' && !isNaN(elementProps.width) ? elementProps.width : 100}
      height={typeof elementProps.height === 'number' && !isNaN(elementProps.height) ? elementProps.height : 30}
      text={layer.content || ''}
      fontSize={layer.font.size}
      fontFamily={layer.font.family}
      fontStyle={`${layer.font.style === 'italic' ? 'italic' : ''} ${layer.font.weight}`.trim()}
      letterSpacing={layer.font.letterSpacing}
      lineHeight={layer.font.lineHeight}
      fill={layer.fill || '#000000'}
      align={layer.alignment}
      textBaseline="alphabetic"
      visible={layer.visible}
      // Drop shadow
      shadowEnabled={!!shadow}
      shadowColor={shadow?.color}
      shadowBlur={shadow?.blur}
      shadowOffsetX={shadow?.offsetX}
      shadowOffsetY={shadow?.offsetY}
      shadowOpacity={shadow?.opacity}
      // Stroke
      stroke={stroke ? stroke.color : undefined}
      strokeWidth={stroke ? stroke.width : undefined}
      strokeEnabled={!!stroke}
      fillAfterStrokeEnabled={true}
    />
  );
};

export default KonvaTextNode; 