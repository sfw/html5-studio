const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(PROJECTS_DIR);

const getProjectDir = (id) => path.join(PROJECTS_DIR, id);
const getProjectFile = (id) => path.join(getProjectDir(id), 'project.json');
const getAssetsDir = (id) => path.join(getProjectDir(id), 'assets');

function listProjects() {
  ensureDir(PROJECTS_DIR);
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  const projects = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const projectFile = getProjectFile(entry.name);
    if (!fs.existsSync(projectFile)) continue;

    try {
      const raw = fs.readFileSync(projectFile, 'utf-8');
      const data = JSON.parse(raw);
      projects.push({
        id: data.id,
        name: data.name,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch {
      // Skip corrupted project files
    }
  }

  // Sort by updated_at descending
  projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return projects;
}

function getProject(id) {
  const projectFile = getProjectFile(id);
  if (!fs.existsSync(projectFile)) return null;
  const raw = fs.readFileSync(projectFile, 'utf-8');
  return JSON.parse(raw);
}

function createProject(name, animationData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const project = {
    id,
    name,
    animation_data: animationData,
    created_at: now,
    updated_at: now,
  };

  const projectDir = getProjectDir(id);
  ensureDir(projectDir);
  ensureDir(getAssetsDir(id));
  fs.writeFileSync(getProjectFile(id), JSON.stringify(project, null, 2));
  return project;
}

function updateProject(id, updates) {
  const existing = getProject(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    id, // prevent ID overwrite
    updated_at: new Date().toISOString(),
  };

  fs.writeFileSync(getProjectFile(id), JSON.stringify(updated, null, 2));
  return updated;
}

function deleteProject(id) {
  const projectDir = getProjectDir(id);
  if (!fs.existsSync(projectDir)) return false;
  fs.rmSync(projectDir, { recursive: true, force: true });
  return true;
}

function saveAsset(projectId, filename, buffer) {
  const assetsDir = getAssetsDir(projectId);
  ensureDir(assetsDir);
  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/assets/${projectId}/assets/${filename}`;
}

module.exports = {
  DATA_DIR,
  PROJECTS_DIR,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  saveAsset,
  getAssetsDir,
};
