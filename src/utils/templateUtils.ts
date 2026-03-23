import { v4 as uuidv4 } from 'uuid';
import type { LayerData, AnimationData } from '@/types/index';

export interface CustomTemplate {
  id: string;
  name: string;
  createdAt: string;
  stageSize: { width: number; height: number };
  layers: LayerData[];
  animations: AnimationData[];
  fps: number;
  duration: number;
}

const STORAGE_KEY = 'snsanimate_custom_templates';

export function loadCustomTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCustomTemplate(
  template: Omit<CustomTemplate, 'id' | 'createdAt'>
): CustomTemplate {
  const t: CustomTemplate = {
    ...template,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  const existing = loadCustomTemplates();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, t]));
  return t;
}

export function deleteCustomTemplate(id: string): void {
  const existing = loadCustomTemplates();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(t => t.id !== id)));
}
