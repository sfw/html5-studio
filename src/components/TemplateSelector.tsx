import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";

const templates = [
  { size: "728x90", category: "Banners", preview: "728x90.png" },
  { size: "468x60", category: "Banners", preview: "468x60.png" },
  { size: "970x90", category: "Banners", preview: "970x90.png" },
  { size: "970x250", category: "Banners", preview: "970x250.png" },
  { size: "300x250", category: "Rectangles", preview: "300x250.png" },
  { size: "336x280", category: "Rectangles", preview: "336x280.png" },
  { size: "250x250", category: "Rectangles", preview: "250x250.png" },
  { size: "200x200", category: "Rectangles", preview: "200x200.png" },
  { size: "120x600", category: "Skyscrapers", preview: "120x600.png" },
  { size: "160x600", category: "Skyscrapers", preview: "160x600.png" },
  { size: "300x600", category: "Skyscrapers", preview: "300x600.png" },
  { size: "300x1050", category: "Skyscrapers", preview: "300x1050.png" },
  { size: "320x50", category: "Mobile", preview: "320x50.png" },
  { size: "320x100", category: "Mobile", preview: "320x100.png" },
  { size: "320x480", category: "Mobile", preview: "320x480.png" },
  { size: "480x800", category: "Mobile", preview: "480x800.png" },
];

function TemplateSelector({ onSelect }: { onSelect: (templateSize: string) => void }) {
  const getPreviewStyle = (size: string) => {
    const [width, height] = size.split('x').map(Number);
    const aspectRatio = width / height;
    const containerWidth = 240; // Reduced from 280 to account for padding
    
    let previewWidth, previewHeight;
    
    if (aspectRatio > 1) {
      // Wider than tall - fit to width
      previewWidth = Math.min(containerWidth, width);
      previewHeight = previewWidth / aspectRatio;
    } else {
      // Taller than wide - fit to height, max 160px
      previewHeight = Math.min(160, height);
      previewWidth = previewHeight * aspectRatio;
    }

    // Scale down if width exceeds container
    if (previewWidth > containerWidth) {
      const scale = containerWidth / previewWidth;
      previewWidth *= scale;
      previewHeight *= scale;
    }

    return {
      width: `${previewWidth}px`,
      height: `${previewHeight}px`
    };
  };

  return (
    <Tabs defaultValue="Banners" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="Banners" className="text-xs">Banners</TabsTrigger>
        <TabsTrigger value="Rectangles" className="text-xs">Rectangles</TabsTrigger>
        <TabsTrigger value="Skyscrapers" className="text-xs">Skyscrapers</TabsTrigger>
        <TabsTrigger value="Mobile" className="text-xs">Mobile</TabsTrigger>
      </TabsList>
      
      <ScrollArea className="h-[calc(100vh-300px)] overflow-y-auto">
        {Object.entries(templates.reduce((acc, template) => {
          if (!acc[template.category]) {
            acc[template.category] = [];
          }
          acc[template.category].push(template);
          return acc;
        }, {} as Record<string, typeof templates>)).map(([category, categoryTemplates]) => (
          <TabsContent key={category} value={category} className="mt-0 py-2">
            <div className="grid grid-cols-1 gap-4">
              {categoryTemplates.map((template) => {
                const previewStyle = getPreviewStyle(template.size);
                return (
                  <Card key={template.size} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium">{template.size}</h4>
                        <Button 
                          size="sm" 
                          onClick={() => onSelect(template.size)}
                          className="shrink-0"
                        >
                          Select
                        </Button>
                      </div>
                      <div className="flex items-center justify-center rounded-sm p-4">
                        <div 
                          className="overflow-hidden"
                          style={previewStyle}
                        >
                          <img 
                            src={`/previews/${template.preview}`}
                            alt={`${template.size} preview`}
                            className="object-contain"
                            onError={(e) => { 
                              const imgElement = e.target as HTMLImageElement; 
                              console.error(`Image load failed for src: ${imgElement.src}`); 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </ScrollArea>
    </Tabs>
  );
}

export default TemplateSelector; 