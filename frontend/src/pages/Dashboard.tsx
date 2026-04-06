import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { getProjects, createProject } from '../api/projects';
import { getTasks } from '../api/tasks';
import { getSprints } from '../api/sprints';
import { CheckCircle2, Clock, PlayCircle, Plus, X, Layout, ArrowRight, Loader2, CheckSquare } from 'lucide-react';
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

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(''),
  });

  const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;
  
  const sprintQueries = useQueries({
    queries: (projects || []).map((project) => ({
      queryKey: ['sprints', project.id],
      queryFn: () => getSprints(project.id),
      enabled: !!project.id,
    })),
  });

  const allSprints = sprintQueries.flatMap(q => q.data || []);
  const activeSprints = allSprints.filter(s => s.status === 'active').length;
  const completedSprints = allSprints.filter(s => s.status === 'completed').length;


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
          <h1 className="section-title">Project Dashboard</h1>
          <p className="section-subtitle">Overview of your active workspace and team progress.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="lg" className="shadow-primary/20 gap-2">
          <Plus className="w-5 h-5" /> New Project
        </Button>
      </motion.div>

      {projects && projects.length === 0 ? (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 border border-primary/20 dark:border-slate-700 p-8 md:p-16 text-center shadow-xl shadow-primary/5 mt-8"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl pointer-events-none">
            <div className="w-64 h-64 bg-primary rounded-full mix-blend-multiply"></div>
          </div>
          <div className="absolute bottom-0 left-0 p-12 opacity-10 blur-3xl pointer-events-none">
            <div className="w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 shadow-xl shadow-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
               <Layout className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              Welcome to Your Workspace!
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              You haven't joined any active projects yet. To get started and unlock your dashboard analytics, create your first project and begin organizing your tasks, sprints, and team members.
            </p>
            <div className="pt-6">
               <Button onClick={() => setIsCreating(true)} size="lg" className="shadow-lg shadow-primary/20 gap-3 h-14 px-8 text-lg hover:scale-105 transition-transform">
                 <Plus className="w-6 h-6" /> Create My First Project
               </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Active Projects', value: projects?.length || 0, icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Pending Tasks', value: pendingTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Active Sprints', value: activeSprints, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Completed Sprints', value: completedSprints, icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 flex items-center gap-4 card-gradient">
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
                    <Card className="h-full p-8 flex flex-col justify-between group cursor-pointer card-gradient">
                      <div className="space-y-4">
                        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <Layout className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-primary transition-colors">{project.name}</h3>
                          <p className="text-slate-500 mt-2 line-clamp-2 font-medium">{project.description || 'No description provided.'}</p>
                        </div>
                      </div>
                      <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-300">
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
            </div>
          </div>
        </>
      )}

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
              <Card className="p-8 md:p-10 shadow-2xl border-none overflow-hidden relative card-gradient">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="section-title">New Project</h2>
                    <p className="section-subtitle">Define your project workspace</p>
                  </div>
                  <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Description</label>
                    <textarea
                      className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-700 dark:text-slate-200 transition-all min-h-[120px]"
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
