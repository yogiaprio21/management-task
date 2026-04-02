import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '../api/projects';
import { CheckCircle2, Clock, PlayCircle, Plus, X, Layout, ArrowRight, Loader2, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      setIsCreating(false);
      setName('');
      setDescription('');
    },
    onError: () => {
      toast.error('Failed to create project');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, description });
  };

  if (projectsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Project Dashboard</h1>
          <p className="text-slate-500 text-lg font-medium">Overview of your active workspace and team progress.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="lg" className="shadow-primary/20 gap-2">
          <Plus className="w-5 h-5" /> New Project
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Projects', value: projects?.length || 0, icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Tasks', value: 12, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed Sprints', value: 5, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Efficiency', value: '100%', icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Projects List Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Layout className="w-6 h-6 text-slate-400" />
          <h2 className="text-2xl font-bold text-slate-800">Recent Projects</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects?.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Link to={`/projects/${project.id}`}>
                <Card className="h-full p-8 flex flex-col justify-between group cursor-pointer border-2 border-transparent hover:border-primary/20">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      <Layout className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-slate-500 mt-2 line-clamp-2 font-medium">{project.description || 'No description provided.'}</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                        +1
                      </div>
                    </div>
                    <div className="text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Project <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
          
          {projects?.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
              <Layout className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No projects found</h3>
              <p className="text-slate-500 mb-8 font-medium text-lg">Create your first project to start tracking your work.</p>
              <Button onClick={() => setIsCreating(true)} size="lg">Create My First Project</Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
            >
              <Card className="p-8 md:p-10 shadow-2xl border-none overflow-hidden relative">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">New Project</h2>
                    <p className="text-slate-500 font-medium">Define your project workspace</p>
                  </div>
                  <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <Input
                    label="Project Name"
                    required
                    placeholder="e.g. Next-Gen App"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-700 transition-all min-h-[120px]"
                      placeholder="What is this project about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 h-12 text-base font-bold" isLoading={createMutation.isPending}>
                      Create Project
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setIsCreating(false)} className="flex-1 h-12 text-base font-bold">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
