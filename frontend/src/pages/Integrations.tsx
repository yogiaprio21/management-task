import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { getWebhooks, createWebhook, deleteWebhook } from '../api/integrations';
import { Plus, Webhook as WebhookIcon, Trash2, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const Integrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [url, setUrl] = useState('');

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', selectedProjectId],
    queryFn: () => getWebhooks(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', selectedProjectId] });
      setUrl('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks', selectedProjectId] })
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !selectedProjectId) return;
    createMutation.mutate({ url, events: ['task.created', 'sprint.completed'], active: true, projectId: selectedProjectId });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <WebhookIcon className="w-10 h-10 text-primary" /> Integrations
          </h1>
          <p className="text-slate-500 text-lg font-medium">Connect TaskFlow with external services like Slack or Discord.</p>
        </div>
        <div>
           <select 
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold shadow-sm"
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Add New Webhook</h3>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input 
              label="Payload URL" 
              placeholder="https://discord.com/api/webhooks/..." 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              required
            />
          </div>
          <Button type="submit" isLoading={createMutation.isPending} className="mb-0.5">
            <Plus className="w-5 h-5 mr-1" /> Add
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
         <h3 className="text-xl font-bold text-slate-800">Active Webhooks</h3>
         {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
         ) : !webhooks || webhooks.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-slate-400 font-medium">No webhooks configured for this project.</p>
            </div>
         ) : (
            webhooks.map(wh => (
              <Card key={wh.id} className="p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${wh.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                  <div>
                    <p className="font-bold text-slate-700 font-mono text-sm">{wh.url}</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Listening to: {wh.events.join(', ')}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(wh.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </Card>
            ))
         )}
      </div>
    </div>
  );
};

export default Integrations;
