import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload } from 'lucide-react';
import { ImageLayerData, LayerProperty, LayerPropertyValue } from '@/types/index';

const FIT_OPTIONS: { value: ImageLayerData['fit']; label: string; title: string }[] = [
  { value: 'fill',    label: 'Fill',    title: 'Stretch to fill bounds' },
  { value: 'contain', label: 'Contain', title: 'Scale to fit within bounds, preserve ratio' },
  { value: 'cover',   label: 'Cover',   title: 'Scale to fill and clip, preserve ratio' },
  { value: 'none',    label: 'None',    title: 'Draw at native image size' },
];

interface ImageLayerPropertiesProps {
  selectedLayer: ImageLayerData;
  onUpdateLayerProperty: (layerId: string | null, property: LayerProperty, value: LayerPropertyValue) => void;
}

const ImageLayerProperties: React.FC<ImageLayerPropertiesProps> = ({
  selectedLayer,
  onUpdateLayerProperty,
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        if (dataUrl) {
            onUpdateLayerProperty(selectedLayer.id, 'src', dataUrl);
            // Optional: Update dimensions based on image
            const img = new Image();
            img.onload = () => {
                // Only update if width/height are default or unset (e.g., 0 or undefined)
                const currentWidth = selectedLayer.width;
                const currentHeight = selectedLayer.height;
                if (!currentWidth || currentWidth <= 1) { // Check against 1 or 0 for safety
                    onUpdateLayerProperty(selectedLayer.id, 'width', img.width);
                }
                if (!currentHeight || currentHeight <= 1) {
                    onUpdateLayerProperty(selectedLayer.id, 'height', img.height);
                }
            };
            img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2 pt-4 border-t border-border mt-4">
      <label className="text-xs font-medium text-muted-foreground">Image Source</label>
      <Input 
        value={selectedLayer.src ? (selectedLayer.src.startsWith('data:image') ? 'Uploaded Image' : selectedLayer.src) : ''} 
        readOnly 
        placeholder="No image selected" 
      />
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full" 
        onClick={() => document.getElementById(`fileInput-${selectedLayer.id}`)?.click()}
      >
        <Upload className="h-3.5 w-3.5 mr-2" /> Upload/Select Image
      </Button>
      <input 
        type="file" 
        id={`fileInput-${selectedLayer.id}`} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Fit</label>
        <div className="grid grid-cols-4 gap-1">
          {FIT_OPTIONS.map(opt => (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedLayer.fit === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-0"
                  onClick={() => onUpdateLayerProperty(selectedLayer.id, 'fit', opt.value)}
                >
                  {opt.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{opt.title}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageLayerProperties; 