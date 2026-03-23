import React from 'react';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HexColorPicker, RgbColorPicker } from 'react-colorful';
import { ColorLayerData, LayerProperty, LayerPropertyValue } from '@/types/index';
import { hexToRgb, rgbToHex, rgbToCmyk, cmykToRgb } from '@/utils/colorUtils';

interface ColorLayerPropertiesProps {
  selectedLayer: ColorLayerData;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
}

const ColorLayerProperties: React.FC<ColorLayerPropertiesProps> = ({ 
  selectedLayer,
  onUpdateLayerProperty
}) => {
  return (
    <div className="space-y-1 pt-4 border-t border-border mt-4">
      <label className="text-xs font-medium text-muted-foreground">Fill Color</label>
      <Popover>
        <PopoverTrigger asChild>
          <div 
            className="w-full h-8 rounded-md border border-input cursor-pointer" 
            style={{ backgroundColor: selectedLayer.fill }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 bg-white">
          <Tabs defaultValue="hex" className="w-[240px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hex">Hex</TabsTrigger>
              <TabsTrigger value="rgb">RGB</TabsTrigger>
              <TabsTrigger value="cmyk">CMYK</TabsTrigger>
            </TabsList>
            <TabsContent value="hex" className="space-y-2">
              <HexColorPicker 
                color={selectedLayer.fill} 
                onChange={(color) => onUpdateLayerProperty(selectedLayer.id, 'fill', color)}
              />
              <Input 
                value={selectedLayer.fill}
                onChange={(e) => onUpdateLayerProperty(selectedLayer.id, 'fill', e.target.value)}
                className="font-mono"
              />
            </TabsContent>
            <TabsContent value="rgb" className="space-y-2">
              <RgbColorPicker
                color={hexToRgb(selectedLayer.fill)}
                onChange={(rgb) => onUpdateLayerProperty(selectedLayer.id, 'fill', rgbToHex(rgb.r, rgb.g, rgb.b))}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">R</label>
                  <Input 
                    type="number"
                    min="0"
                    max="255"
                    value={hexToRgb(selectedLayer.fill).r}
                    onChange={(e) => {
                      const rgb = hexToRgb(selectedLayer.fill);
                      onUpdateLayerProperty(
                        selectedLayer.id,
                        'fill',
                        rgbToHex(parseInt(e.target.value) || 0, rgb.g, rgb.b)
                      );
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">G</label>
                  <Input 
                    type="number"
                    min="0"
                    max="255"
                    value={hexToRgb(selectedLayer.fill).g}
                    onChange={(e) => {
                      const rgb = hexToRgb(selectedLayer.fill);
                      onUpdateLayerProperty(
                        selectedLayer.id,
                        'fill',
                        rgbToHex(rgb.r, parseInt(e.target.value) || 0, rgb.b)
                      );
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs">B</label>
                  <Input 
                    type="number"
                    min="0"
                    max="255"
                    value={hexToRgb(selectedLayer.fill).b}
                    onChange={(e) => {
                      const rgb = hexToRgb(selectedLayer.fill);
                      onUpdateLayerProperty(
                        selectedLayer.id,
                        'fill',
                        rgbToHex(rgb.r, rgb.g, parseInt(e.target.value) || 0)
                      );
                    }}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="cmyk" className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {['C', 'M', 'Y', 'K'].map((channel) => {
                  const rgb = hexToRgb(selectedLayer.fill);
                  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
                  const value = cmyk[channel.toLowerCase() as keyof typeof cmyk];
                  
                  return (
                    <div key={channel}>
                      <label className="text-xs">{channel}</label>
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(value * 100)}
                        onChange={(e) => {
                          const newValue = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
                          const newCmyk = { ...cmyk, [channel.toLowerCase()]: newValue };
                          const newRgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                          onUpdateLayerProperty(
                            selectedLayer.id,
                            'fill',
                            rgbToHex(newRgb.r, newRgb.g, newRgb.b)
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorLayerProperties; 