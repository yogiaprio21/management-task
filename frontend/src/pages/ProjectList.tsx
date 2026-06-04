import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { Plus, Folder, Trash2, Layout, Calendar, ArrowRight, Loader2, X, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { useWorkspace } from '../context/WorkspaceContext';

const ProjectList: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const queryClient = useQueryClient();
  const { selectedWorkspaceId, selectedWorkspace, workspaces } = useWorkspace();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects');
      return data;
    },
    select: (data) => {
      const scoped = selectedWorkspaceId ? data.filter((project) => !project.workspaceId || project.workspaceId === selectedWorkspaceId) : data;
      // Sort projects by deadline (nearest first)
      return [...scoped].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newProject: { name: string; description: string; deadline?: string; workspaceId?: string }) => {
      return await api.post('/projects', newProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectDeadline('');
      toast.success('Project created successfully!');
    },
    onError: () => {
      toast.error('Failed to create project');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteConfirmOpen(null);
      toast.success('Project deleted successfully!');
    },
    onError: () => {
       setDeleteConfirmOpen(null);
       toast.error('Failed to delete project');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createMutation.mutate({ 
      name: newProjectName, 
      description: newProjectDesc,
      deadline: newProjectDeadline,
      workspaceId: selectedWorkspaceId,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const canDelete = (project: Project) => {
    return user?.role === 'admin' || user?.id === project.ownerId;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-slate-500 font-medium">Loading your projects...</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {selectedWorkspace?.name || 'Workspaces'}
          </h1>
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">
            {workspaces.length > 1 ? 'Manage projects inside the selected workspace.' : 'Manage personal and team projects.'}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-primary/20" disabled={!selectedWorkspaceId}>
          <Plus className="w-5 h-5" /> New Project
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects?.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="group flex h-full flex-col justify-between p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-all duration-200 group-hover:bg-primary group-hover:text-white dark:bg-blue-950 dark:text-blue-300">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {project.deadline && (
                      <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="w-3 h-3" />
                        {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {canDelete(project) && (
                      <button 
                        onClick={() => setDeleteConfirmOpen(project.id)}
                        className="rounded-md p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="line-clamp-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-slate-50">{project.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {project.description || 'No description provided for this project.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <Link to={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="font-bold text-primary gap-1 group-hover:bg-primary/5">
                    Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-slate-50 py-20 text-center dark:border-slate-700 dark:bg-slate-900">
            <Layout className="mx-auto mb-6 h-14 w-14 text-slate-300 dark:text-slate-600" />
            <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Workspace Empty</h3>
            <p className="mx-auto mb-8 max-w-md text-base font-medium text-slate-600 dark:text-slate-300">Create a project to start separating personal work and team collaboration.</p>
            <Button onClick={() => setIsModalOpen(true)}>Create First Project</Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card className="border-none p-6 shadow-2xl md:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">New Project</h2>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Create inside {selectedWorkspace?.name || 'selected workspace'}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="rounded-md p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input label="Project Name" required placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} autoFocus />
                  <DatePicker id="project-deadline" label="Target Deadline" value={newProjectDeadline} onChange={setNewProjectDeadline} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                    <textarea className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50" placeholder="Description" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 h-12 text-base font-bold shadow-lg" isLoading={createMutation.isPending}>Create Project</Button>
                    <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 text-base font-bold">Cancel</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
              <Card className="p-8 text-center border-none shadow-2xl">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">Delete Project?</h3>
                <p className="mb-8 font-medium text-slate-600 dark:text-slate-300">This action cannot be undone. All tasks and data will be permanently removed.</p>
                <div className="flex gap-3">
                  <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteConfirmOpen)} isLoading={deleteMutation.isPending}>Delete</Button>
                  <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmOpen(null)}>Cancel</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectList;
