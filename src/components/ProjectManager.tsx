import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProjectData } from '@/types/index';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Trash2, FolderOpen } from 'lucide-react';
import { listProjects, getProject, deleteProject, type ProjectSummary } from '@/api/projects';

interface ProjectManagerProps {
  onLoad: (projectData: ProjectData, projectName: string, projectId: string) => void;
}

function ProjectManager({
  onLoad,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      fetchProjects();
    }
  }, [fetchProjects, isDialogOpen]);

  const handleLoad = async (project: ProjectSummary) => {
    try {
      setLoading(true);
      const full = await getProject(project.id);
      onLoad(full.animation_data as ProjectData, full.name, full.id);
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error loading project:", err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project: ProjectSummary) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) {
      setError("Cannot delete project. Information missing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteProject(projectToDelete.id);
      alert(`Project "${projectToDelete.name}" deleted successfully.`);
      setProjectToDelete(null);
      await fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during deletion');
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Projects</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Project Manager</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Load Project</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !projects.length ? (
                <div>Loading projects...</div>
              ) : error && !projects.length ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{project.updated_at ? new Date(project.updated_at).toLocaleString() : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLoad(project)}
                                  disabled={loading}
                                >
                                  <FolderOpen className="h-4 w-4 mr-1" />
                                  Load
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClick(project)}
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No saved projects yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                "<strong>{projectToDelete?.name}</strong>"
                and all its associated assets.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectManager;
