import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { getBacklogItems, createBacklogItem, updateBacklogItem, deleteBacklogItem } from '../api/backlog';
import { getSprints } from '../api/sprints';
import { createTask } from '../api/tasks';
import { LayoutList, Loader2, Plus, Edit2, Trash2, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const ProductBacklog: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editStatus, setEditStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: backlogItems, isLoading: backlogLoading } = useQuery({
    queryKey: ['backlog', selectedProjectId],
    queryFn: () => getBacklogItems(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', selectedProjectId],
    queryFn: () => getSprints(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const activeSprint = sprints?.find(s => s.status === 'active');

  const createBacklogMutation = useMutation({
    mutationFn: createBacklogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
      setIsCreating(false);
      setTitle('');
      toast.success('Backlog item created successfully');
    },
    onError: () => toast.error('Failed to create backlog item'),
  });

  const updateBacklogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateBacklogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
      setEditingItem(null);
      toast.success('Backlog item updated successfully');
    },
    onError: () => toast.error('Failed to update backlog item'),
  });

  const deleteBacklogMutation = useMutation({
    mutationFn: deleteBacklogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
      toast.success('Backlog item deleted successfully');
    },
    onError: () => toast.error('Failed to delete backlog item'),
  });

  const moveToSprintMutation = useMutation({
    mutationFn: async (item: { id: string; title: string; description: string; priority: 'low' | 'medium' | 'high' }) => {
      if (!activeSprint) throw new Error('No active sprint found');
      // Create a task in the active sprint from this backlog item
      await createTask({
        title: item.title,
        description: item.description || '',
        priority: item.priority,
        sprintId: activeSprint.id,
        backlogItemId: item.id,
      });
      // Delete the backlog item after successfully moving it
      await deleteBacklogItem(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      toast.success('Item moved to active sprint!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to move item to sprint');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;
    createBacklogMutation.mutate({ title, description: '', priority, projectId: selectedProjectId });
  };

  const handleUpdate = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    updateBacklogMutation.mutate({ id, data: { title: editTitle, priority: editPriority, status: editStatus } });
  };

  if (projectsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
            <LayoutList className="w-10 h-10 text-primary" /> Product Backlog
          </h1>
          <p className="max-w-2xl text-base font-medium text-slate-600 dark:text-slate-300">Manage and prioritize upcoming features and tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Sprint Badge */}
      {activeSprint && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-emerald-700">Active Sprint: {activeSprint.name}</span>
          <span className="text-xs text-emerald-500 font-medium">
            ({new Date(activeSprint.startDate).toLocaleDateString()} — {new Date(activeSprint.endDate).toLocaleDateString()})
          </span>
        </motion.div>
      )}

      {!activeSprint && selectedProjectId && (
        <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
          <span className="text-sm font-bold text-amber-700">⚠ No active sprint for this project. Create and activate a sprint in Project Details to enable "Move to Sprint".</span>
        </div>
      )}

      <div className="surface-panel p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Queue</h3>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <Card className="border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                  <Input placeholder="What needs to be done?" className="flex-1" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="control">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={createBacklogMutation.isPending}>Save</Button>
                    <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-3">
          {backlogLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : backlogItems?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">No items in the backlog for this project.</div>
          ) : (
            backlogItems?.map((item) => (
              editingItem === item.id ? (
                <Card key={item.id} className="border-primary bg-slate-50 p-4 shadow-md dark:bg-slate-800">
                   <form onSubmit={(e) => handleUpdate(e, item.id)} className="flex flex-col gap-4">
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-slate-800 dark:text-slate-100">Edit Backlog Item</h4>
                       <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                     </div>
                     <Input placeholder="What needs to be done?" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus />
                     <div className="flex gap-4">
                       <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="control flex-1">
                         <option value="low">Low Priority</option>
                         <option value="medium">Medium Priority</option>
                         <option value="high">High Priority</option>
                       </select>
                       <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="control flex-1">
                         <option value="todo">To Do</option>
                         <option value="in_progress">In Progress</option>
                         <option value="done">Done</option>
                       </select>
                     </div>
                     <div className="flex gap-2 justify-between mt-2">
                       <div>
                         <Button type="button" variant="secondary" onClick={() => setDeleteId(item.id)} className="text-red-500 hover:text-red-600 border-red-200"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                       </div>
                       <Button type="submit" isLoading={updateBacklogMutation.isPending}>Save Changes</Button>
                     </div>
                   </form>
                </Card>
              ) : (
                <Card 
                  key={item.id} 
                  className="flex items-center justify-between px-5 py-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <div 
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => {
                      setEditingItem(item.id);
                      setEditTitle(item.title);
                      setEditPriority(item.priority);
                      setEditStatus(item.status);
                    }}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="block font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.status.replace('_', ' ')}</span>
                     {activeSprint && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           moveToSprintMutation.mutate({
                             id: item.id,
                             title: item.title,
                             description: item.description || '',
                             priority: item.priority,
                           });
                         }}
                         disabled={moveToSprintMutation.isPending}
                         title={`Move to sprint: ${activeSprint.name}`}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                       >
                         <Zap className="w-3.5 h-3.5" />
                         To Sprint
                       </button>
                     )}
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setEditingItem(item.id);
                         setEditTitle(item.title);
                         setEditPriority(item.priority);
                         setEditStatus(item.status);
                       }}
                       className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                     >
                       <Edit2 className="w-4 h-4 text-slate-300 hover:text-primary transition-colors" />
                     </button>
                  </div>
                </Card>
              )
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete backlog item?"
        description="This backlog item will be removed from the queue. Sprint tasks already created from it are not changed."
        confirmLabel="Delete"
        isLoading={deleteBacklogMutation.isPending}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteBacklogMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
    </div>
  );
};

export default ProductBacklog;
