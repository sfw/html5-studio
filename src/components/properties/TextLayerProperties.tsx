import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { HexColorPicker, RgbColorPicker } from 'react-colorful';
import { TextLayerData, LayerProperty, LayerPropertyValue } from '@/types/index';
import { hexToRgb, rgbToHex, rgbToCmyk, cmykToRgb } from '@/utils/colorUtils';
import { loadGoogleFont, capitalizeFontName } from '@/utils/fontUtils';
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TextLayerPropertiesProps {
  selectedLayer: TextLayerData;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
}

const TextLayerProperties: React.FC<TextLayerPropertiesProps> = ({
  selectedLayer,
  onUpdateLayerProperty,
}) => {
  // State for font popover
  const [fontPopoverOpen, setFontPopoverOpen] = React.useState(false);
  const [fontSearchTerm, setFontSearchTerm] = React.useState("");
  // TODO: Replace with actual fetch/import of Google Fonts list
  const [googleFontList, setGoogleFontList] = React.useState<string[]>([]);
  const [loadingFonts, setLoadingFonts] = React.useState(true);

  // Fetch Google Font list on mount
  React.useEffect(() => {
    const fetchFontList = async () => {
      setLoadingFonts(true);
      try {
        const response = await fetch('https://raw.githubusercontent.com/fontsource/font-files/main/FONTLIST.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // The response is an object where keys are font names
        const fontListObject: Record<string, unknown> = await response.json(); 
        const fontNames = Object.keys(fontListObject); // Extract the keys (font names)

        // Replace hyphens with spaces before storing
        const fontNamesWithSpaces = fontNames.map(name => name.replace(/-/g, ' '));

        // Add common system fonts to the list as well
        const systemFonts = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Lucida Console'];
        const combinedList = Array.from(new Set([...systemFonts, ...fontNamesWithSpaces])).sort(); // Combine, remove duplicates, sort
        setGoogleFontList(combinedList);
        console.log(`Loaded ${combinedList.length} font families.`);
      } catch (error) {
        console.error("Failed to fetch Google Fonts list:", error);
        // Fallback to a basic list in case of error
        setGoogleFontList(['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Roboto', 'Lato', 'Montserrat', 'Open Sans']);
      } finally {
        setLoadingFonts(false);
      }
    };

    fetchFontList();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Log the received selectedLayer prop on render
  console.log(`[TextLayerProps] Rendering with weight: ${selectedLayer.font.weight}`);

  // Helper to update nested font properties
  const handleFontUpdate = (fontProp: keyof TextLayerData['font'], value: string | number) => {
    const newFont = { ...selectedLayer.font, [fontProp]: value };
    // Log the font object being sent up
    console.log(`[TextLayerProps] handleFontUpdate called. Prop: ${fontProp}, Value: ${value}. New font object:`, JSON.parse(JSON.stringify(newFont)));
    onUpdateLayerProperty(selectedLayer.id, 'font', newFont);
  };


  return (
    <div className="space-y-4 pt-4 border-t border-border mt-4">
      <h3 className="text-sm font-semibold">Text Properties</h3>
      {/* Text Content */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Text Content</label>
        <Input 
          value={selectedLayer.content || ''} 
          onChange={(e) => onUpdateLayerProperty(selectedLayer.id, 'content', e.target.value)} 
        />
      </div>

      {/* Fill Color Popover */}
      <div className="space-y-1">
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
                   {/* RGB Inputs */}
                    {[ 'r', 'g', 'b' ].map(channel => (
                        <div key={channel}>
                            <label className="text-xs">{channel.toUpperCase()}</label>
                            <Input 
                                type="number" min="0" max="255"
                                value={hexToRgb(selectedLayer.fill)[channel as keyof ReturnType<typeof hexToRgb>]}
                                onChange={(e) => {
                                    const rgb = { ...hexToRgb(selectedLayer.fill), [channel]: parseInt(e.target.value) || 0 };
                                    onUpdateLayerProperty(selectedLayer.id, 'fill', rgbToHex(rgb.r, rgb.g, rgb.b));
                                }}
                            />
                        </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="cmyk" className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* CMYK Inputs */}
                  {['c', 'm', 'y', 'k'].map((channel) => {
                    const rgb = hexToRgb(selectedLayer.fill);
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
                            onUpdateLayerProperty(selectedLayer.id, 'fill', rgbToHex(newRgb.r, newRgb.g, newRgb.b));
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

      {/* Font Properties */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Font</label>
        {/* Font Family Popover Selector */}
        <Popover open={fontPopoverOpen} onOpenChange={setFontPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={fontPopoverOpen}
              className="w-full justify-between font-normal"
            >
              {selectedLayer.font.family ? capitalizeFontName(selectedLayer.font.family) : "Select font..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput 
                placeholder="Search fonts..." 
                value={fontSearchTerm}
                onValueChange={setFontSearchTerm}
                disabled={loadingFonts}
              />
              <CommandList>
                <ScrollArea className="h-[300px]">
                  <CommandEmpty>{loadingFonts ? 'Loading fonts...' : 'No font found.'}</CommandEmpty>
                  <CommandGroup>
                    {googleFontList
                      .filter(font => font.toLowerCase().includes(fontSearchTerm.toLowerCase()))
                      .map((font) => (
                        <CommandItem
                          key={font}
                          value={font} // Value for Command internal filtering/navigation (lowercase, space-separated)
                          onSelect={async (currentValue) => { // Make handler async
                            // Find the original case font name from the list (lowercase, space-separated)
                            const originalFontName = googleFontList.find(f => f.toLowerCase() === currentValue.toLowerCase()) || font;
                            let fontLoaded = false;
                            // Attempt to load the selected font dynamically (pass the space-separated name)
                            const systemFontCheckList = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 'Lucida Console'];
                            if (!systemFontCheckList.some(sf => sf.toLowerCase() === originalFontName.toLowerCase())) { // Case-insensitive check
                              // Wait for the font to load
                              fontLoaded = await loadGoogleFont(originalFontName);
                            } else {
                              // System fonts are considered 'loaded'
                              fontLoaded = true;
                            }
                            // Only update state if font is ready
                            if (fontLoaded) {
                              // Update state directly now that font is loaded
                              console.log(`[TextLayerProps] Font ${originalFontName} active, updating state.`);
                              handleFontUpdate('family', originalFontName);
                            } else {
                              // Optional: Add user feedback if font fails to load
                              console.warn(`Font ${originalFontName} failed to load or timed out.`);
                              // Maybe revert selection or show an error?
                            }
                            setFontPopoverOpen(false);
                            setFontSearchTerm(""); // Clear search on select
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLayer.font.family === font ? "opacity-100" : "opacity-0" // Compare with original case from list
                            )}
                          />
                          {capitalizeFontName(font)} {/* Display capitalized name (already has spaces) */}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="grid grid-cols-2 gap-2">
          {/* Font Size */}
          <div>
            <label className="text-xs">Size</label>
            <Input
              type="number"
              value={selectedLayer.font.size}
              min={1}
              onChange={(e) => handleFontUpdate('size', parseFloat(e.target.value) || 1)}
            />
          </div>
          {/* Font Weight */}
          <div>
             <label className="text-xs">Weight</label>
             <Select
                key={`font-weight-${selectedLayer.font.weight}`}
                value={selectedLayer.font.weight.toString()}
                onValueChange={(value) => handleFontUpdate('weight', parseInt(value))}
             >
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="100">100 Thin</SelectItem>
                    <SelectItem value="200">200 Extra Light</SelectItem>
                    <SelectItem value="300">300 Light</SelectItem>
                    <SelectItem value="400">400 Normal</SelectItem>
                    <SelectItem value="500">500 Medium</SelectItem>
                    <SelectItem value="600">600 Semi Bold</SelectItem>
                    <SelectItem value="700">700 Bold</SelectItem>
                    <SelectItem value="800">800 Extra Bold</SelectItem>
                    <SelectItem value="900">900 Black</SelectItem>
                </SelectContent>
             </Select>
          </div>
          {/* Font Style */}
          <div>
             <label className="text-xs">Style</label>
             <Select
                value={selectedLayer.font.style}
                onValueChange={(value: 'normal' | 'italic') => handleFontUpdate('style', value)}
             >
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                </SelectContent>
             </Select>
          </div>
          {/* Alignment */}
          <div>
            <label className="text-xs">Alignment</label>
            <Select
              value={selectedLayer.alignment}
              onValueChange={(value: 'left' | 'center' | 'right') => onUpdateLayerProperty(selectedLayer.id, 'alignment', value)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Letter Spacing */}
          <div>
            <label className="text-xs">Spacing</label>
            <Input
              type="number"
              step={0.1}
              value={selectedLayer.font.letterSpacing}
              onChange={(e) => handleFontUpdate('letterSpacing', parseFloat(e.target.value) || 0)}
            />
          </div>
           {/* Line Height */}
          <div>
            <label className="text-xs">Line Ht</label>
            <Input
              type="number"
              step={0.1}
              min={0}
              value={selectedLayer.font.lineHeight}
              onChange={(e) => handleFontUpdate('lineHeight', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Text Effects */}
      <Accordion type="single" collapsible className="pt-4 border-t border-border mt-4">
        <AccordionItem value="effects" className="border-none">
          <AccordionTrigger className="text-sm font-semibold py-0 pb-3">Effects</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-2">

            {/* Drop Shadow */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shadow-enable"
                  checked={!!selectedLayer.effects?.shadow}
                  onChange={(e) => {
                    const effects = { ...selectedLayer.effects };
                    if (e.target.checked) {
                      effects.shadow = { color: '#000000', blur: 4, offsetX: 2, offsetY: 2, opacity: 0.5 };
                    } else {
                      delete effects.shadow;
                    }
                    onUpdateLayerProperty(selectedLayer.id, 'effects', effects);
                  }}
                  className="rounded"
                />
                <label htmlFor="shadow-enable" className="text-xs font-medium">Drop Shadow</label>
              </div>
              {selectedLayer.effects?.shadow && (() => {
                const s = selectedLayer.effects.shadow!;
                const update = (patch: Partial<typeof s>) => {
                  onUpdateLayerProperty(selectedLayer.id, 'effects', {
                    ...selectedLayer.effects,
                    shadow: { ...s, ...patch }
                  });
                };
                return (
                  <div className="pl-5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Color</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="w-full h-7 rounded border border-input cursor-pointer mt-0.5" style={{ backgroundColor: s.color }} />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3"><HexColorPicker color={s.color} onChange={(c) => update({ color: c })} /></PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Opacity {Math.round(s.opacity * 100)}%</label>
                        <Slider className="mt-2" min={0} max={1} step={0.01} value={[s.opacity]} onValueChange={([v]) => update({ opacity: v })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Blur {s.blur}px</label>
                      <Slider className="mt-1" min={0} max={50} step={1} value={[s.blur]} onValueChange={([v]) => update({ blur: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">X</label>
                        <Input type="number" value={s.offsetX} onChange={(e) => update({ offsetX: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Y</label>
                        <Input type="number" value={s.offsetY} onChange={(e) => update({ offsetY: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Stroke */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stroke-enable"
                  checked={!!selectedLayer.effects?.stroke}
                  onChange={(e) => {
                    const effects = { ...selectedLayer.effects };
                    if (e.target.checked) {
                      effects.stroke = { color: '#000000', width: 2, opacity: 1 };
                    } else {
                      delete effects.stroke;
                    }
                    onUpdateLayerProperty(selectedLayer.id, 'effects', effects);
                  }}
                  className="rounded"
                />
                <label htmlFor="stroke-enable" className="text-xs font-medium">Stroke</label>
              </div>
              {selectedLayer.effects?.stroke && (() => {
                const st = selectedLayer.effects.stroke!;
                const update = (patch: Partial<typeof st>) => {
                  onUpdateLayerProperty(selectedLayer.id, 'effects', {
                    ...selectedLayer.effects,
                    stroke: { ...st, ...patch }
                  });
                };
                return (
                  <div className="pl-5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Color</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="w-full h-7 rounded border border-input cursor-pointer mt-0.5" style={{ backgroundColor: st.color }} />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3"><HexColorPicker color={st.color} onChange={(c) => update({ color: c })} /></PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Opacity {Math.round(st.opacity * 100)}%</label>
                        <Slider className="mt-2" min={0} max={1} step={0.01} value={[st.opacity]} onValueChange={([v]) => update({ opacity: v })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Width {st.width}px</label>
                      <Slider className="mt-1" min={1} max={20} step={1} value={[st.width]} onValueChange={([v]) => update({ width: v })} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TextLayerProperties; 