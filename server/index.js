const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3001;
const uploadsDir = path.join(__dirname, 'uploads');
const allowedExtensions = new Set(['.ai', '.pdf']);

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const getSafeUploadPath = (originalName) => {
  const ext = path.extname(path.basename(originalName || '')).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    throw new Error('Unsupported file type. Please upload an AI or PDF file.');
  }

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const resolvedPath = path.resolve(uploadsDir, uniqueName);

  if (!resolvedPath.startsWith(`${uploadsDir}${path.sep}`)) {
    throw new Error('Invalid upload path.');
  }

  return { ext, filePath: resolvedPath, storedName: uniqueName };
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
}));

// --- Serve uploaded project assets ---
app.use('/assets', express.static(db.PROJECTS_DIR));

// --- Project CRUD endpoints ---

// List all projects (without animation_data)
app.get('/api/projects', (_req, res) => {
  try {
    const projects = db.listProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ message: 'Failed to list projects' });
  }
});

// Get a single project (with animation_data)
app.get('/api/projects/:id', (req, res) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ message: 'Failed to get project' });
  }
});

// Create a new project
app.post('/api/projects', (req, res) => {
  try {
    const { name, animation_data } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    const project = db.createProject(name, animation_data || {});
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Update a project
app.put('/api/projects/:id', (req, res) => {
  try {
    const { name, animation_data } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (animation_data !== undefined) updates.animation_data = animation_data;

    const project = db.updateProject(req.params.id, updates);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// Delete a project (including assets)
app.delete('/api/projects/:id', (req, res) => {
  try {
    const deleted = db.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Upload an asset for a project
app.post('/api/assets/:projectId', (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { projectId } = req.params;
    const file = req.files.file;
    const filename = path.basename(file.name || 'upload.bin');
    const url = db.saveAsset(projectId, filename, file.data);

    res.json({ url });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ message: 'Failed to upload asset' });
  }
});

// --- AI/PDF file conversion endpoint (existing) ---
app.post('/api/convert-ai', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;
    ensureUploadsDir();
    const { filePath, storedName } = getSafeUploadPath(file.name);

    await file.mv(filePath);

    res.status(200).json({
      message: 'File uploaded successfully',
      originalName: path.basename(file.name),
      convertedUrl: `/converted/${storedName}.svg`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Unsupported file type') || message === 'Invalid upload path.'
      ? 400
      : 500;
    res.status(status).json({ message: 'Error processing file', error: message });
  }
});

// --- Serve Vite build output in production ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for non-API, non-asset routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/assets')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(port, () => {
  console.log(`HTML5 Studio server running on port ${port}`);
  console.log(`Data directory: ${db.DATA_DIR}`);
});
