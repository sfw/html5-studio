import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from 'react-colorful';
import { Trash2 } from 'lucide-react';
import { GradientLayerData, LayerProperty, LayerPropertyValue } from '@/types/index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RgbColorPicker } from 'react-colorful';
import { hexToRgb, rgbToHex, rgbToCmyk, cmykToRgb } from '@/utils/colorUtils';

interface GradientLayerPropertiesProps {
  selectedLayer: GradientLayerData;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
}

const GradientLayerProperties: React.FC<GradientLayerPropertiesProps> = ({
  selectedLayer,
  onUpdateLayerProperty,
}) => {
  const handleGradientUpdate = (updates: Partial<GradientLayerData['gradient']>) => {
    const updatedGradient = { ...selectedLayer.gradient, ...updates };
    onUpdateLayerProperty(selectedLayer.id, 'gradient', updatedGradient);
  };

  const handleStopChange = (index: number, field: 'color' | 'position', value: string | number) => {
    const stops = [...selectedLayer.gradient.stops];
    stops[index] = { ...stops[index], [field]: value };
    if (field === 'position') {
        stops.sort((a, b) => a.position - b.position);
    }
    handleGradientUpdate({ stops });
  };

  const handleAddStop = () => {
    const stops = [...selectedLayer.gradient.stops, { color: '#ffffff', position: 1 }];
    stops.sort((a, b) => a.position - b.position);
    handleGradientUpdate({ stops });
  };

  const handleRemoveStop = (index: number) => {
    const stops = selectedLayer.gradient.stops.filter((_, i) => i !== index);
    handleGradientUpdate({ stops });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border mt-4">
      <h3 className="text-sm font-semibold">Gradient Properties</h3>
      {/* Gradient Type Select */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Gradient Type</label>
        <Select
          value={selectedLayer.gradient.type}
          onValueChange={(value: 'linear' | 'radial') => handleGradientUpdate({ type: value })}
        >
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color Stops */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Color Stops</label>
        {selectedLayer.gradient.stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
            {/* Color Picker Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <div 
                  className="w-6 h-6 rounded border border-input cursor-pointer" 
                  style={{ backgroundColor: stop.color }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 bg-white">
                <Tabs defaultValue="hex" className="w-[240px]">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hex">Hex</TabsTrigger>
                    <TabsTrigger value="rgb">RGB</TabsTrigger>
                    <TabsTrigger value="cmyk">CMYK</TabsTrigger>
                  </TabsList>
                  <TabsContent value="hex" className="space-y-2 mt-2">
                    <HexColorPicker
                      color={stop.color}
                      onChange={(newColor) => handleStopChange(index, 'color', newColor)}
                    />
                    <Input 
                        value={stop.color}
                        onChange={(e) => handleStopChange(index, 'color', e.target.value)}
                        className="font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="rgb" className="space-y-2 mt-2">
                    <RgbColorPicker
                        color={hexToRgb(stop.color)}
                        onChange={(newRgb) => handleStopChange(index, 'color', rgbToHex(newRgb.r, newRgb.g, newRgb.b))}
                    />
                    <div className="grid grid-cols-3 gap-2">
                        {[ 'r', 'g', 'b' ].map(channel => {
                            const rgb = hexToRgb(stop.color);
                            return (
                                <div key={channel}>
                                    <label className="text-xs">{channel.toUpperCase()}</label>
                                    <Input 
                                        type="number" min="0" max="255"
                                        value={rgb[channel as keyof typeof rgb]}
                                        onChange={(e) => {
                                            const updatedRgb = { ...rgb, [channel]: parseInt(e.target.value) || 0 };
                                            handleStopChange(index, 'color', rgbToHex(updatedRgb.r, updatedRgb.g, updatedRgb.b));
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                  </TabsContent>
                  <TabsContent value="cmyk" className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                        {['c', 'm', 'y', 'k'].map((channel) => {
                            const rgb = hexToRgb(stop.color);
                            const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
                            const value = cmyk[channel as keyof typeof cmyk];
                            return (
                            <div key={channel}>
                                <label className="text-xs">{channel.toUpperCase()}</label>
                                <Input 
                                type="number" min="0" max="100"
                                value={Math.round(value * 100)}
                                onChange={(e) => {
                                    const newValue = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
                                    const newCmyk = { ...cmyk, [channel]: newValue };
                                    const newRgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                                    handleStopChange(index, 'color', rgbToHex(newRgb.r, newRgb.g, newRgb.b));
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
            {/* Position Slider */}
            <Slider
              value={[stop.position]}
              max={1}
              step={0.01}
              onValueChange={([newPos]) => handleStopChange(index, 'position', newPos)}
              className="flex-1"
            />
            {/* Position Percentage */}
            <span className="text-xs w-8 text-right">{Math.round(stop.position * 100)}%</span>
            {/* Remove Stop Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleRemoveStop(index)}
              disabled={selectedLayer.gradient.stops.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {/* Add Stop Button */}
        <Button variant="outline" size="sm" onClick={handleAddStop}>
          Add Color Stop
        </Button>
      </div>

      {/* Linear Gradient Controls */}
      {selectedLayer.gradient.type === 'linear' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Linear Points (Relative)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">Start X</label>
              <Input 
                type="number" step={0.01} min={0} max={1}
                value={selectedLayer.gradient.start?.x ?? 0.5} 
                onChange={(e) => handleGradientUpdate({ start: { y: selectedLayer.gradient.start?.y ?? 0, x: parseFloat(e.target.value) || 0 } })}
              />
            </div>
            <div>
              <label className="text-xs">Start Y</label>
              <Input 
                type="number" step={0.01} min={0} max={1}
                value={selectedLayer.gradient.start?.y ?? 0} 
                onChange={(e) => handleGradientUpdate({ start: { x: selectedLayer.gradient.start?.x ?? 0.5, y: parseFloat(e.target.value) || 0 } })}
              />
            </div>
            <div>
              <label className="text-xs">End X</label>
              <Input 
                type="number" step={0.01} min={0} max={1}
                value={selectedLayer.gradient.end?.x ?? 0.5} 
                onChange={(e) => handleGradientUpdate({ end: { y: selectedLayer.gradient.end?.y ?? 1, x: parseFloat(e.target.value) || 0 } })}
              />
            </div>
            <div>
              <label className="text-xs">End Y</label>
              <Input 
                type="number" step={0.01} min={0} max={1}
                value={selectedLayer.gradient.end?.y ?? 1} 
                onChange={(e) => handleGradientUpdate({ end: { x: selectedLayer.gradient.end?.x ?? 0.5, y: parseFloat(e.target.value) || 0 } })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Radial Gradient Controls */}
      {selectedLayer.gradient.type === 'radial' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Radial Center (Relative)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">Center X</label>
              <Input 
                type="number" step={0.01} min={0} max={1}
                value={selectedLayer.gradient.center?.x ?? 0.5} 
                onChange={(e) => handleGradientUpdate({ center: { y: selectedLayer.gradient.center?.y ?? 0.5, x: parseFloat(e.target.value) || 0 } })}
              />
            </div>
            <div>
              <label className="text-xs">Center Y</label>
              <Input 
                type="number" step={0.01} min={0} max={1}
                value={selectedLayer.gradient.center?.y ?? 0.5} 
                onChange={(e) => handleGradientUpdate({ center: { x: selectedLayer.gradient.center?.x ?? 0.5, y: parseFloat(e.target.value) || 0 } })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Radius (Relative)</label>
            <Slider
              value={[selectedLayer.gradient.radius ?? 0.5]}
              max={1.5} step={0.01}
              onValueChange={([radius]) => handleGradientUpdate({ radius })}
              className="flex-1"
            />
            <span className="text-xs">{(selectedLayer.gradient.radius ?? 0.5).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradientLayerProperties; 