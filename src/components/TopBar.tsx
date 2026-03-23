import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Download, Save, Archive, Undo2, Redo2, Play, Settings2 } from 'lucide-react';
import { ShortcutsHelpButton } from './KeyboardShortcutsHelp';
import type { ProjectData, ExportTarget } from '@/types/index';
import ProjectManager from './ProjectManager';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from './ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TopBarProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => Promise<void>;
  onPreview?: () => void;
  exporting: boolean;
  uploadError: string | null;
  currentProjectData: ProjectData;
  onLoadProjectData: (projectData: ProjectData, projectName: string) => void;
  onSaveProject: (projectName: string) => Promise<boolean>;
  hasDataToSave: boolean;
  canSaveNow: boolean;
  loadedProjectName: string | null;
  onBatchExport: () => void;
  isBatchExporting?: boolean;
  sceneCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onShowShortcuts: () => void;
  saveStatus?: string;
  exportFilename?: string;
  exportTarget?: ExportTarget;
  onExportFilenameChange?: (v: string) => void;
  onExportTargetChange?: (v: ExportTarget) => void;
}

const TopBar: React.FC<TopBarProps> = ({
  onFileUpload,
  onExport,
  onPreview,
  exporting,
  uploadError,
  onLoadProjectData,
  hasDataToSave,
  canSaveNow,
  loadedProjectName,
  onSaveProject,
  onBatchExport,
  isBatchExporting,
  sceneCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShowShortcuts,
  saveStatus,
  exportFilename = 'ad_package',
  exportTarget = 'generic',
  onExportFilenameChange,
  onExportTargetChange,
}) => {
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverProjectName, setPopoverProjectName] = useState('');
  const [isSavingPopover, setIsSavingPopover] = useState(false);

  const handleSaveClick = async () => {
    if (canSaveNow && loadedProjectName) {
      setIsSavingPopover(true);
      await onSaveProject(loadedProjectName);
      setIsSavingPopover(false);
    } else {
      setPopoverProjectName('');
    }
  };

  const handlePopoverSave = async () => {
    if (!popoverProjectName) {
      alert("Please enter a project name.");
      return;
    }
    setIsSavingPopover(true);
    const success = await onSaveProject(popoverProjectName);
    setIsSavingPopover(false);
    if (success) {
      setPopoverOpen(false);
    }
  };

  return (
    <div className="flex justify-between items-center p-3 border-b border-border">
      <h1 className="text-xl font-semibold text-foreground">HTML5 Studio</h1>
      <div className="flex items-center space-x-2">
        <div >
          <Input id="file-upload" type="file" accept=".svg,.ai" onChange={onFileUpload} className="hidden" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="file-upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 cursor-pointer">
                <Upload className="h-4 w-4" />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload SVG/AI</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {uploadError && <p className="text-xs text-destructive ml-2">{uploadError}</p>}

        <div className="border-l border-border mx-2 h-6" />

        <ProjectManager
          onLoad={onLoadProjectData}
        />

        {canSaveNow ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleSaveClick} 
                disabled={!hasDataToSave || isSavingPopover} 
                variant="outline" 
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingPopover ? 'Saving...' : 'Save Project'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save updates to "{loadedProjectName}"</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!hasDataToSave}
                aria-label="Save new project"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Project As...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Save New Project</h4>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="popover-project-name">Project Name</Label>
                  <Input
                    id="popover-project-name"
                    value={popoverProjectName}
                    onChange={(e) => setPopoverProjectName(e.target.value)}
                    placeholder="My Awesome Ad"
                  />
                </div>
                <Button onClick={handlePopoverSave} disabled={isSavingPopover || !popoverProjectName}>
                  {isSavingPopover ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {onPreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onPreview} variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Preview the exported ad in-browser</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onExport} disabled={exporting} variant="default" size="sm" className="rounded-r-none border-r-0">
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export HTML5'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export as HTML5 package ({exportTarget === 'dv360' ? 'DV360' : exportTarget === 'gdn' ? 'GDN' : exportTarget === 'ttd' ? 'Trade Desk' : 'Generic'})</p>
            </TooltipContent>
          </Tooltip>
          <Popover open={exportSettingsOpen} onOpenChange={setExportSettingsOpen}>
            <PopoverTrigger asChild>
              <Button variant="default" size="icon" className="h-9 w-7 rounded-l-none">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="grid gap-3">
                <h4 className="font-medium text-sm">Export Settings</h4>
                <div className="grid gap-1.5">
                  <Label htmlFor="export-filename" className="text-xs">Filename</Label>
                  <Input
                    id="export-filename"
                    value={exportFilename}
                    onChange={e => onExportFilenameChange?.(e.target.value)}
                    placeholder="ad_package"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Target Platform</Label>
                  <Select value={exportTarget} onValueChange={v => onExportTargetChange?.(v as ExportTarget)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">Generic HTML5</SelectItem>
                      <SelectItem value="gdn">Google Display Network</SelectItem>
                      <SelectItem value="dv360">DV360 / Enabler</SelectItem>
                      <SelectItem value="ttd">The Trade Desk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {saveStatus && (
          <span className="text-xs text-muted-foreground ml-1">{saveStatus}</span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button 
                variant="ghost"
                size="icon"
                onClick={onBatchExport}
                disabled={exporting || isBatchExporting || sceneCount <= 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="h-5 w-5" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Batch Export All Scenes (ZIP)</p>
          </TooltipContent>
        </Tooltip>

        <div className="border-l border-border mx-2 h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Redo (Ctrl+Shift+Z)</p></TooltipContent>
        </Tooltip>

        <ShortcutsHelpButton onClick={onShowShortcuts} />

        <ThemeToggle />

      </div>
    </div>
  );
};

export default TopBar; 
