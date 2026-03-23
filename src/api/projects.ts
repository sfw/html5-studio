const API_BASE = '/api';

export interface ProjectSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFull extends ProjectSummary {
  animation_data: unknown;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(`Failed to list projects: ${res.statusText}`);
  return res.json();
}

export async function getProject(id: string): Promise<ProjectFull> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error(`Failed to get project: ${res.statusText}`);
  return res.json();
}

export async function createProject(name: string, animationData: unknown): Promise<ProjectFull> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, animation_data: animationData }),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.statusText}`);
  return res.json();
}

export async function updateProject(id: string, name: string, animationData: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, animation_data: animationData }),
  });
  if (!res.ok) throw new Error(`Failed to update project: ${res.statusText}`);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete project: ${res.statusText}`);
}

export async function uploadAsset(projectId: string, file: Blob, filename: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename);

  const res = await fetch(`${API_BASE}/assets/${projectId}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload asset: ${res.statusText}`);
  const data = await res.json();
  return data.url;
}
