import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from 'lucide-react';
import { loadCustomTemplates, deleteCustomTemplate, CustomTemplate } from '@/utils/templateUtils';

/** CSS-drawn aspect-ratio preview — no image files needed */
function TemplateAspectPreview({ width, height }: { width: number; height: number }) {
  const MAX_W = 120, MAX_H = 80;
  const aspect = width / height;
  let w: number, h: number;
  if (aspect > MAX_W / MAX_H) { w = MAX_W; h = Math.round(MAX_W / aspect); }
  else { h = MAX_H; w = Math.round(MAX_H * aspect); }

  return (
    <div className="flex items-center justify-center py-2" style={{ minHeight: MAX_H + 8 }}>
      <div
        className="border border-border bg-muted/60 flex items-center justify-center rounded-sm"
        style={{ width: w, height: h }}
      >
        <span className="text-[10px] text-muted-foreground font-mono select-none">
          {width}×{height}
        </span>
      </div>
    </div>
  );
}

interface TemplateInfo {
  key: string;
  name: string;
  category: 'Display' | 'Half Page' | 'Mobile' | 'Other';
  width: number;
  height: number;
}

const templates: TemplateInfo[] = [
  { key: '728x90',   name: 'Leaderboard',         category: 'Display',   width: 728,  height: 90   },
  { key: '300x250',  name: 'Medium Rectangle',     category: 'Display',   width: 300,  height: 250  },
  { key: '336x280',  name: 'Large Rectangle',      category: 'Display',   width: 336,  height: 280  },
  { key: '468x60',   name: 'Banner',               category: 'Display',   width: 468,  height: 60   },
  { key: '970x90',   name: 'Large Leaderboard',    category: 'Display',   width: 970,  height: 90   },
  { key: '970x250',  name: 'Billboard',            category: 'Display',   width: 970,  height: 250  },
  { key: '300x600',  name: 'Half Page',            category: 'Half Page', width: 300,  height: 600  },
  { key: '160x600',  name: 'Wide Skyscraper',      category: 'Half Page', width: 160,  height: 600  },
  { key: '120x600',  name: 'Skyscraper',           category: 'Half Page', width: 120,  height: 600  },
  { key: '300x1050', name: 'Portrait',             category: 'Half Page', width: 300,  height: 1050 },
  { key: '320x50',   name: 'Mobile Banner',        category: 'Mobile',    width: 320,  height: 50   },
  { key: '320x100',  name: 'Large Mobile Banner',  category: 'Mobile',    width: 320,  height: 100  },
  { key: '320x480',  name: 'Mobile Interstitial',  category: 'Mobile',    width: 320,  height: 480  },
  { key: '480x800',  name: 'Tablet Interstitial',  category: 'Mobile',    width: 480,  height: 800  },
  { key: '200x200',  name: 'Small Square',         category: 'Other',     width: 200,  height: 200  },
  { key: '250x250',  name: 'Square',               category: 'Other',     width: 250,  height: 250  },
];

type Category = 'Display' | 'Half Page' | 'Mobile' | 'Other';
const categories: Category[] = ['Display', 'Half Page', 'Mobile', 'Other'];
const categoryDescriptions: Record<Category, string> = {
  Display: 'Common web display placements',
  'Half Page': 'Sidebar and tall format placements',
  Mobile: 'Phone and tablet placements',
  Other: 'Square and non-standard formats',
};

interface TemplateSelectorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectTemplate: (templateKey: string | null) => void;
  onCreateCustomScene: (w: number, h: number, name: string) => void;
  onLoadCustomTemplate: (template: CustomTemplate) => void;
}

const TemplateSelectorDialog: React.FC<TemplateSelectorDialogProps> = ({
  isOpen,
  onOpenChange,
  onSelectTemplate,
  onCreateCustomScene,
  onLoadCustomTemplate,
}) => {
  const [customW, setCustomW] = useState(300);
  const [customH, setCustomH] = useState(250);
  const [customName, setCustomName] = useState('');
  const [myTemplates, setMyTemplates] = useState<CustomTemplate[]>([]);

  const handleOpenChange = (open: boolean) => {
    if (open) setMyTemplates(loadCustomTemplates());
    onOpenChange(open);
  };

  const handleSelect = (key: string | null) => {
    onSelectTemplate(key);
    onOpenChange(false);
  };

  const handleCreateCustom = () => {
    const name = customName.trim() || `Custom ${customW}×${customH}`;
    onCreateCustomScene(customW, customH, name);
    onOpenChange(false);
  };

  const handleDeleteCustom = (id: string) => {
    deleteCustomTemplate(id);
    setMyTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleLoadCustom = (template: CustomTemplate) => {
    onLoadCustomTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Scene</DialogTitle>
          <DialogDescription>
            Choose a template based on common IAB ad sizes, or define custom dimensions.
          </DialogDescription>
        </DialogHeader>

        <Button variant="outline" className="mb-2" onClick={() => handleSelect(null)}>
          Start with Blank Scene (800×600)
        </Button>

        <Tabs defaultValue="Display" className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 flex flex-wrap h-auto gap-1">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
            ))}
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="my" onClick={() => setMyTemplates(loadCustomTemplates())}>
              My Templates {myTemplates.length > 0 ? `(${myTemplates.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto p-1 mt-2">
            {categories.map(cat => (
              <TabsContent key={cat} value={cat} className="mt-0">
                <p className="text-xs text-muted-foreground mb-3">{categoryDescriptions[cat]}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.filter(t => t.category === cat).map(template => (
                    <Card key={template.key} className="overflow-hidden">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{template.width} × {template.height}</p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <TemplateAspectPreview width={template.width} height={template.height} />
                        <Button className="w-full mt-2 h-8 text-xs" onClick={() => handleSelect(template.key)}>
                          Use {template.key}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {templates.filter(t => t.category === cat).length === 0 && (
                    <p className="text-muted-foreground col-span-full text-center py-4">No templates in this category.</p>
                  )}
                </div>
              </TabsContent>
            ))}

            {/* Custom size tab */}
            <TabsContent value="custom" className="mt-0">
              <div className="max-w-sm space-y-4">
                <p className="text-xs text-muted-foreground">Enter any dimensions to create a blank scene.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Width (px)</Label>
                    <Input type="number" min={1} value={customW} onChange={e => setCustomW(parseInt(e.target.value) || 1)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Height (px)</Label>
                    <Input type="number" min={1} value={customH} onChange={e => setCustomH(parseInt(e.target.value) || 1)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Scene Name (optional)</Label>
                  <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder={`Custom ${customW}×${customH}`} className="mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <TemplateAspectPreview width={customW} height={customH} />
                  <Button onClick={handleCreateCustom} className="flex-1">
                    Create {customW}×{customH} Scene
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* My Templates tab */}
            <TabsContent value="my" className="mt-0">
              {myTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No saved templates yet.</p>
                  <p className="text-xs mt-1">Use "Save as Template" in the Stage tab to save the current scene.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myTemplates.map(tmpl => (
                    <Card key={tmpl.id} className="overflow-hidden">
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{tmpl.stageSize.width} × {tmpl.stageSize.height}</p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <TemplateAspectPreview width={tmpl.stageSize.width} height={tmpl.stageSize.height} />
                        <div className="flex gap-1 mt-2">
                          <Button className="flex-1 h-8 text-xs" onClick={() => handleLoadCustom(tmpl)}>
                            Use
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => handleDeleteCustom(tmpl.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectorDialog;
