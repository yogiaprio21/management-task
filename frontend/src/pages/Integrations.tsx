import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, PlugZap, Send, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createWebhook, deleteWebhook, getWebhooks, testWebhook, updateWebhook } from '../api/integrations';
import ProjectSwitcher from '../components/ProjectSwitcher';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';

const eventOptions = [
  { value: 'task.created', label: 'Task created' },
  { value: 'task.status_changed', label: 'Task status changed' },
  { value: 'sprint.completed', label: 'Sprint completed' },
];

const Integrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['task.created', 'task.status_changed']);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks', selectedProjectId],
    queryFn: () => getWebhooks(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const selectedEvents = useMemo(() => new Set(events), [events]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['webhooks', selectedProjectId] });

  const createMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      invalidate();
      setUrl('');
      toast.success('Webhook created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast.success('Webhook deleted');
    },
  });

  const testMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess: (result) => {
      invalidate();
      toast[result.ok ? 'success' : 'error'](`Webhook test ${result.ok ? 'sent' : 'failed'} (${result.status})`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateWebhook(id, { active }),
    onSuccess: () => invalidate(),
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!url || !selectedProjectId || events.length === 0) return;
    createMutation.mutate({ url, events, active: true, projectId: selectedProjectId });
  };

  const toggleEvent = (eventName: string) => {
    setEvents((current) =>
      current.includes(eventName) ? current.filter((item) => item !== eventName) : [...current, eventName],
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Integrations"
        description="Send project activity to Discord, Slack-compatible endpoints, or any service that accepts webhooks."
        icon={<WebhookIcon className="h-5 w-5" />}
        actions={<ProjectSwitcher value={selectedProjectId} onChange={setSelectedProjectId} />}
      />

      <Card hover={false} className="p-5">
        <div className="mb-5 flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Add Webhook</h3>
        </div>
        <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Input
            label="Payload URL"
            placeholder="https://discord.com/api/webhooks/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
          <Button type="submit" isLoading={createMutation.isPending} disabled={!selectedProjectId || events.length === 0}>
            Add Webhook
          </Button>
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Events</p>
            <div className="flex flex-wrap gap-2">
              {eventOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleEvent(option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    selectedEvents.has(option.value)
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Active Webhooks</h3>
        {!selectedProjectId ? (
          <EmptyState icon={<WebhookIcon className="h-7 w-7" />} title="No project selected" description="Select a project to manage integrations." />
        ) : isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : webhooks.length === 0 ? (
          <EmptyState icon={<WebhookIcon className="h-7 w-7" />} title="No webhooks configured" description="Add a Discord or Slack-compatible URL to publish project events." />
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} hover={false} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={webhook.active ? 'green' : 'slate'}>{webhook.active ? 'Active' : 'Paused'}</Badge>
                    {webhook.lastStatus && <Badge tone={String(webhook.lastStatus).startsWith('2') ? 'green' : 'red'}>Last {webhook.lastStatus}</Badge>}
                    {webhook.lastTriggeredAt && <span className="text-xs text-slate-500">Triggered {new Date(webhook.lastTriggeredAt).toLocaleString()}</span>}
                  </div>
                  <p className="truncate font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{webhook.url}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {webhook.events.map((event) => <Badge key={event} tone="blue">{event}</Badge>)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => testMutation.mutate(webhook.id)} isLoading={testMutation.isPending}>
                    <Send className="h-4 w-4" />
                    Test
                  </Button>
                  <Button variant="secondary" onClick={() => toggleMutation.mutate({ id: webhook.id, active: !webhook.active })}>
                    <CheckCircle2 className="h-4 w-4" />
                    {webhook.active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteId(webhook.id)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete webhook?"
        description="This endpoint will stop receiving project events. Existing project data is not affected."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
};

export default Integrations;
