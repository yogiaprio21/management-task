import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { getBacklogItems, createBacklogItem, updateBacklogItem, deleteBacklogItem } from '../api/backlog';
import { LayoutList, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import type { BacklogItem } from '../types';

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

  const createBacklogMutation = useMutation({
    mutationFn: createBacklogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
      setIsCreating(false);
      setTitle('');
    }
  });

  const updateBacklogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateBacklogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
      setEditingItem(null);
    }
  });

  const deleteBacklogMutation = useMutation({
    mutationFn: deleteBacklogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', selectedProjectId] });
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
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <LayoutList className="w-10 h-10 text-primary" /> Product Backlog
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg font-medium">Manage and prioritize upcoming features and tasks.</p>
        </div>
        <div>
          <select 
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold shadow-sm"
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Queue</h3>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <Card className="bg-slate-50 border-slate-200 p-4">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                  <Input placeholder="What needs to be done?" className="flex-1" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium">
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
                <Card key={item.id} className="p-4 bg-slate-50 border-primary shadow-md">
                   <form onSubmit={(e) => handleUpdate(e, item.id)} className="flex flex-col gap-4">
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-slate-700">Edit Backlog Item</h4>
                       <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                     </div>
                     <Input placeholder="What needs to be done?" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus />
                     <div className="flex gap-4">
                       <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium">
                         <option value="low">Low Priority</option>
                         <option value="medium">Medium Priority</option>
                         <option value="high">High Priority</option>
                       </select>
                       <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium">
                         <option value="todo">To Do</option>
                         <option value="in_progress">In Progress</option>
                         <option value="done">Done</option>
                       </select>
                     </div>
                     <div className="flex gap-2 justify-between mt-2">
                       <div>
                         <Button type="button" variant="secondary" onClick={() => { if(window.confirm('Delete item?')) deleteBacklogMutation.mutate(item.id); }} className="text-red-500 hover:text-red-600 border-red-200"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                       </div>
                       <Button type="submit" isLoading={updateBacklogMutation.isPending}>Save Changes</Button>
                     </div>
                   </form>
                </Card>
              ) : (
                <Card 
                  key={item.id} 
                  className="py-4 px-6 flex items-center justify-between hover:border-primary hover:shadow-md cursor-pointer transition-all"
                  onClick={() => {
                    setEditingItem(item.id);
                    setEditTitle(item.title);
                    setEditPriority(item.priority);
                    setEditStatus(item.status);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold text-slate-700 block">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.status.replace('_', ' ')}</span>
                     <Edit2 className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBacklog;
