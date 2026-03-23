import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  PropertiesPanelProps
} from '@/types/index';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Copy, AlignLeft, AlignCenterHorizontal, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from "lucide-react";

// Import the new panel components
import LayerPanel from './properties/LayerPanel';
import AnimationPanel from './properties/AnimationPanel';
import StagePanel from './properties/StagePanel';
import TemplatesPanel from './properties/TemplatesPanel';
import AssetPanel from './AssetPanel';

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedLayer,
  stageSize,
  totalDuration,
  fps,
  animations,
  currentFrame,
  selectedKeyframe,
  editingKeyframe,
  onUpdateLayerProperty,
  onSetStageSize,
  onSetTotalDuration,
  onSetFps,
  onTemplateSelect,
  onUpdateKeyframe,
  onSetKeyframeProperty,
  onDeleteLayer,
  onDuplicateLayer,
  onDeleteKeyframe,
  onSetGlobalLoop,
  activeTab = 'layer',
  onTabChange,
  scenes = [],
  onUseAsset,
  onSaveAsTemplate,
}) => {
  // Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If a keyframe is actively being edited globally, ignore delete key here
      if (editingKeyframe) {
        console.log('[PropertiesPanel] Keydown ignored, keyframe is actively selected.');
        return; 
      }

      // Check if the event originated from within the timeline area
      const targetElement = e.target as HTMLElement;
      if (targetElement?.closest('[data-timeline-area="true"]')) {
        console.log('[PropertiesPanel] Keydown ignored, originated from timeline.');
        return; // Don't handle keydown if it came from the timeline
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayer) {
        // Prevent triggering if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        e.preventDefault(); // Prevent browser back navigation on backspace
        setIsDeleteDialogOpen(true);
      }
    };

    // Add listener back to the window
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Remove listener from the window on cleanup
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedLayer, editingKeyframe]); // Add editingKeyframe to dependencies

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedLayer) {
      onDeleteLayer(selectedLayer.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

  // Moved JSX
  return (
    <div className="w-80 border-l border-border flex flex-col overflow-y-auto">
      {/* Add AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Layer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the layer "{selectedLayer?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full flex flex-col flex-1">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="layer">Layer</TabsTrigger>
          <TabsTrigger value="animation">Animation</TabsTrigger>
          <TabsTrigger value="stage">Stage</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        {/* Layer Properties Tab */}
        <TabsContent value="layer" className="p-4 flex-1 overflow-y-auto">
          {selectedLayer ? (
            <>
              {/* Alignment toolbar */}
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-2">Align to canvas</p>
                <div className="flex gap-1">
                  {[
                    { icon: AlignLeft, label: 'Align left', action: () => onUpdateLayerProperty(selectedLayer.id, 'x', 0) },
                    { icon: AlignCenterHorizontal, label: 'Centre horizontally', action: () => onUpdateLayerProperty(selectedLayer.id, 'x', (stageSize.width - (selectedLayer.width ?? 0)) / 2) },
                    { icon: AlignRight, label: 'Align right', action: () => onUpdateLayerProperty(selectedLayer.id, 'x', stageSize.width - (selectedLayer.width ?? 0)) },
                    { icon: AlignStartVertical, label: 'Align top', action: () => onUpdateLayerProperty(selectedLayer.id, 'y', 0) },
                    { icon: AlignCenterVertical, label: 'Centre vertically', action: () => onUpdateLayerProperty(selectedLayer.id, 'y', (stageSize.height - (selectedLayer.height ?? 0)) / 2) },
                    { icon: AlignEndVertical, label: 'Align bottom', action: () => onUpdateLayerProperty(selectedLayer.id, 'y', stageSize.height - (selectedLayer.height ?? 0)) },
                  ].map(({ icon: Icon, label, action }) => (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7 flex-1" onClick={action}>
                          <Icon className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{label}</p></TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <LayerPanel
                selectedLayer={selectedLayer}
                onUpdateLayerProperty={onUpdateLayerProperty}
                onDeleteLayer={() => setIsDeleteDialogOpen(true)}
              />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8 text-sm">Select a layer to edit its properties.</div>
          )}
        </TabsContent>

        {/* Animation Properties Tab */}
        <TabsContent value="animation" className="p-4 flex-1 overflow-y-auto">
          <AnimationPanel
            selectedLayer={selectedLayer}
            animations={animations}
            currentFrame={currentFrame}
            selectedKeyframe={selectedKeyframe}
            editingKeyframe={editingKeyframe}
            onUpdateLayerProperty={onUpdateLayerProperty}
            onUpdateKeyframe={onUpdateKeyframe}
            onSetKeyframeProperty={onSetKeyframeProperty}
            onDeleteKeyframe={onDeleteKeyframe}
          />
        </TabsContent>

        {/* Stage Properties Tab */}
        <TabsContent value="stage" className="p-4 space-y-4 flex-1 overflow-y-auto">
          <StagePanel
            stageSize={stageSize}
            totalDuration={totalDuration}
            fps={fps}
            totalFrames={totalFrames}
            onSetStageSize={onSetStageSize}
            onSetTotalDuration={onSetTotalDuration}
            onSetFps={onSetFps}
            onSetGlobalLoop={onSetGlobalLoop}
            onSaveAsTemplate={onSaveAsTemplate}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="p-4 flex-1 overflow-y-auto">
          <TemplatesPanel onTemplateSelect={onTemplateSelect} />
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="flex-1 overflow-y-auto">
          <AssetPanel
            scenes={scenes}
            selectedLayerId={selectedLayer?.id ?? null}
            onUseAsset={onUseAsset ?? (() => {})}
          />
        </TabsContent>
      </Tabs>

      {/* Layer actions — Duplicate + Delete */}
      {selectedLayer && (
        <div className="p-4 border-t border-border mt-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDuplicateLayer(selectedLayer.id)}
            title="Duplicate layer (Ctrl+D)"
          >
            <Copy className="h-4 w-4 mr-2" />Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />Delete
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel; 