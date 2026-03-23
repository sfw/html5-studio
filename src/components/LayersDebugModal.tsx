import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { LayerData } from '@/types/index'; // Assuming types are in this path
import { ClipboardCopy } from 'lucide-react';

interface LayersDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  layersData: LayerData[];
}

const LayersDebugModal: React.FC<LayersDebugModalProps> = ({
  isOpen,
  onClose,
  layersData,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const layersJson = JSON.stringify(layersData, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(layersJson).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500); // Reset after 1.5s
    }).catch(err => {
      console.error('Failed to copy layers JSON:', err);
      // Optionally show an error message to the user
    });
  }, [layersJson]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Current Layers State (JSON)</DialogTitle>
          <DialogDescription>
            This is the current state of the active scene's layers array. Order reflects the state before reversal for timeline display.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-4">
          <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
            <code>{layersJson}</code>
          </pre>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={handleCopy} size="sm">
            <ClipboardCopy className="h-4 w-4 mr-2" />
            {isCopied ? 'Copied!' : 'Copy JSON'}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LayersDebugModal; 