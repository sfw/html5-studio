import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from 'lucide-react';
import type { AnimationScene } from '@/types/index';

interface SceneTabsProps {
  scenes: AnimationScene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void; // For now, just triggers the action
  onRenameScene: (sceneId: string, newName: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onReorderScenes: (draggedId: string, targetId: string) => void;
}

const SceneTabs: React.FC<SceneTabsProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onRenameScene,
  onDeleteScene,
  onReorderScenes,
}) => {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDoubleClick = (sceneId: string, currentName: string) => {
    setEditingSceneId(sceneId);
    setTempName(currentName); 
  };

  const handleFinishEdit = () => {
    if (editingSceneId && tempName.trim()) {
      onRenameScene(editingSceneId, tempName.trim());
    }
    setEditingSceneId(null);
    setTempName('');
  };

  const handleCancelEdit = () => {
    setEditingSceneId(null);
    setTempName('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleFinishEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  useEffect(() => {
    if (editingSceneId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSceneId]);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, sceneId: string) => {
    if (editingSceneId === sceneId) {
      e.preventDefault();
      return;
    }
    setDraggedSceneId(sceneId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.setAttribute('data-dragging', 'true');
    console.log('Drag Start:', sceneId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>, targetSceneId: string) => {
    e.preventDefault();
    if (draggedSceneId && draggedSceneId !== targetSceneId) {
      e.dataTransfer.dropEffect = 'move';
      setDropTargetId(targetSceneId);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDropTargetId(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetSceneId: string) => {
    e.preventDefault();
    if (draggedSceneId && draggedSceneId !== targetSceneId) {
      console.log(`Drop: ${draggedSceneId} before ${targetSceneId}`);
      onReorderScenes(draggedSceneId, targetSceneId);
    }
    setDraggedSceneId(null);
    setDropTargetId(null);
    const draggedElement = e.currentTarget.parentElement?.querySelector('[data-dragging="true"]');
    draggedElement?.removeAttribute('data-dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    setDraggedSceneId(null);
    setDropTargetId(null);
    e.currentTarget.removeAttribute('data-dragging');
    console.log('Drag End');
  };

  return (
    <div className="flex items-center border-b border-border px-4 py-1 bg-background">
      <Tabs value={activeSceneId} onValueChange={onSelectScene} className="mr-auto"> 
        <TabsList className="h-8"> 
          {scenes.map(scene => (
            <TabsTrigger 
              key={scene.id} 
              value={scene.id} 
              className={`h-6 px-2 text-xs relative group flex items-center gap-1 
                         ${draggedSceneId === scene.id ? 'opacity-50' : ''} 
                         ${dropTargetId === scene.id ? 'border-l-2 border-primary -ml-0.5 pl-1.5' : ''}`
              }
              draggable={!editingSceneId}
              onDragStart={(e) => handleDragStart(e, scene.id)}
              onDragOver={(e) => handleDragOver(e, scene.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, scene.id)}
              onDragEnd={handleDragEnd}
              onPointerDown={(e) => { if (editingSceneId === scene.id || draggedSceneId) e.stopPropagation(); }}
              onClick={(e) => { if (editingSceneId === scene.id || draggedSceneId) e.preventDefault(); }}
            >
              {editingSceneId === scene.id ? (
                <Input
                  ref={inputRef}
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  className="h-5 px-1 text-xs w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span
                    className="flex-grow flex items-center gap-1"
                    onDoubleClick={() => handleDoubleClick(scene.id, scene.name)}
                  >
                    {scene.name}
                    {scene.hasUnsavedChanges && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                        title="Unsaved changes"
                      />
                    )}
                  </span>
                  {scenes.length > 1 && (
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene(scene.id);
                      }}
                      title={`Delete scene ${scene.name}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 ml-2"
        onClick={onAddScene}
        title="Add New Scene"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SceneTabs; 