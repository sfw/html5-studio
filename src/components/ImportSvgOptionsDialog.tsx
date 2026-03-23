import React from 'react';
import {
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"; // Need Button for actions

interface ImportSvgOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectOption: (option: 'current' | 'new') => void;
}

const ImportSvgOptionsDialog: React.FC<ImportSvgOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  onSelectOption,
}) => {

  const handleSelect = (option: 'current' | 'new') => {
    onSelectOption(option);
    onOpenChange(false); // Close dialog on selection
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import SVG Layers</AlertDialogTitle>
          <AlertDialogDescription>
            Where would you like to add the layers imported from the SVG file?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2"> {/* Add gap for spacing */} 
          {/* Cancel button is optional if clicking an action always closes it */}
          {/* <AlertDialogCancel>Cancel</AlertDialogCancel> */} 
          <Button variant="outline" onClick={() => handleSelect('current')}>Add to Current Scene</Button>
          <Button onClick={() => handleSelect('new')}>Create New Scene</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImportSvgOptionsDialog; 