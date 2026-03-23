import { useState, useCallback } from 'react';
import {
  ProjectData,
  AnimationScene,
  LayerData,
  ImageLayerData,
  ProjectManagementHookArgs,
  UseProjectManagementReturn,
} from '../types';
import { isLocalSrc } from '@/utils/urlUtils';
import { uploadAsset, createProject, updateProject, listProjects } from '@/api/projects';

const isImageLayer = (layer: LayerData): layer is ImageLayerData => {
  return layer.type === 'image' && typeof layer.src === 'string';
};

export const useProjectManagement = ({
  scenes,
  setScenes,
  setActiveSceneId,
  setSelectedLayerId,
  setEditingKeyframe,
}: ProjectManagementHookArgs): UseProjectManagementReturn => {
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const saveProject = useCallback(async (projectName: string): Promise<boolean> => {
    if (!projectName) {
      alert('Project name is required.');
      return false;
    }
    if (!scenes || scenes.length === 0) {
      alert('No project data available to save.');
      return false;
    }

    console.log(`[Save] Attempting to save project: "${projectName}" with ${scenes.length} scene(s)`);

    let projectId = currentProjectId;

    const ensureProjectId = async (): Promise<string> => {
      if (projectId) return projectId;

      // Check if a project with this name already exists
      try {
        const existing = await listProjects();
        const match = existing.find(p => p.name === projectName);
        if (match) {
          projectId = match.id;
          setCurrentProjectId(match.id);
          return match.id;
        }
      } catch {
        // If list fails, just create a new one
      }

      // Create new project
      console.log(`[Save] Creating new project "${projectName}"...`);
      const newProject = await createProject(projectName, {});
      projectId = newProject.id;
      setCurrentProjectId(newProject.id);
      console.log(`[Save] Project created with ID: ${projectId}`);
      return projectId;
    };

    try {
      const preparedScenes: AnimationScene[] = [];
      for (const scene of scenes) {
        console.log(`[Save] Processing scene: ${scene.name} (${scene.id})`);
        const sceneCopy: AnimationScene = JSON.parse(JSON.stringify(scene));

        for (const layer of sceneCopy.layers) {
          if (isImageLayer(layer) && layer.src && isLocalSrc(layer.src)) {
            console.log(`[Save] Uploading asset for layer: ${layer.name} (${layer.id})`);
            try {
              const ensuredProjectId = await ensureProjectId();
              const blob = await fetch(layer.src).then(r => r.blob());
              const fileExt = blob.type.split('/')[1] || 'png';
              const fileName = `${layer.id}.${fileExt}`;

              const url = await uploadAsset(ensuredProjectId, blob, fileName);
              console.log(`[Save] Asset uploaded: ${url}`);
              layer.src = url;
            } catch (assetError) {
              console.error(`[Save] Error uploading asset for layer ${layer.name}:`, assetError);
              throw assetError;
            }
          }
        }
        preparedScenes.push(sceneCopy);
      }

      const projectDataToSave: ProjectData = { scenes: preparedScenes };
      const ensuredProjectId = await ensureProjectId();

      console.log(`[Save] Updating project ${ensuredProjectId}...`);
      await updateProject(ensuredProjectId, projectName, projectDataToSave);

      console.log('Project saved successfully!');
      setLoadedProjectName(projectName);
      setScenes(currentScenes =>
        currentScenes.map(scene => ({ ...scene, hasUnsavedChanges: false }))
      );
      return true;
    } catch (error) {
      console.error('[Save] Error saving project:', error);
      alert(`Error saving project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [scenes, setScenes, setLoadedProjectName, currentProjectId]);

  const loadProject = useCallback((projectData: ProjectData, projectName: string, projectId?: string) => {
    if (projectData && projectData.scenes && projectData.scenes.length > 0) {
      const scenesWithClearedFlag = projectData.scenes.map(scene => ({
        ...scene,
        hasUnsavedChanges: false,
      }));
      setScenes(scenesWithClearedFlag);
      setActiveSceneId(projectData.scenes[0].id);
      setSelectedLayerId(null);
      setEditingKeyframe(null);
      setLoadedProjectName(projectName);
      if (projectId) setCurrentProjectId(projectId);
      console.log(`[Load] Project "${projectName}" loaded successfully! (${projectData.scenes.length} scene(s))`);
    } else {
      console.error('[Load] Invalid project data received:', projectData);
      alert('Failed to load project: Invalid data format.');
      setLoadedProjectName(null);
    }
  }, [setScenes, setActiveSceneId, setSelectedLayerId, setEditingKeyframe, setLoadedProjectName]);

  return {
    loadedProjectName,
    setLoadedProjectName,
    saveProject,
    loadProject,
    isImageLayer,
    isLocalSrc,
  };
};
