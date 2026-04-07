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

const ProjectList: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects');
      return data;
    },
    select: (data) => {
      // Sort projects by deadline (nearest first)
      return [...data].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newProject: { name: string; description: string; deadline?: string }) => {
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
      deadline: newProjectDeadline 
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Your Projects</h1>
          <p className="text-slate-500 text-lg font-medium">Manage and organize all your active workspaces.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2 shadow-primary/20">
          <Plus className="w-5 h-5" /> New Project
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects?.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full p-8 flex flex-col justify-between group relative overflow-hidden">
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Folder className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2">
                    {project.deadline && (
                      <div className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-tight flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {canDelete(project) && (
                      <button 
                        onClick={() => setDeleteConfirmOpen(project.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                  <p className="text-slate-500 mt-2 line-clamp-3 font-medium text-sm leading-relaxed">
                    {project.description || 'No description provided for this project.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
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
          <div className="col-span-full py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
            <Layout className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Workspace Empty</h3>
            <p className="text-slate-500 mb-10 font-medium text-lg max-w-md mx-auto">Create a new project to start collaborating with your team and tracking progress.</p>
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="h-14 px-10 text-lg">Create First Project</Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <Card className="p-8 md:p-10 shadow-2xl border-none card-gradient">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">New Project</h2>
                    <p className="text-slate-500 text-sm font-medium">Define your project workspace</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input label="Project Name" required placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} autoFocus />
                  <Input label="Target Deadline" type="date" value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Description</label>
                    <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-700 transition-all min-h-[120px]" placeholder="Description" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} />
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
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Delete Project?</h3>
                <p className="text-slate-500 font-medium mb-8">This action cannot be undone. All tasks and data will be permanently removed.</p>
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
