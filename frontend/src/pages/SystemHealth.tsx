import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Database, Loader2, Server } from 'lucide-react';
import { checkHealth } from '../api/health';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';

const SystemHealth: React.FC = () => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isHealthy = health?.status === 'ok';

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="System Health"
        description="Application-level readiness for the Render backend and Supabase database connection."
        icon={<Activity className="h-5 w-5" />}
        meta={<Badge tone={isHealthy ? 'green' : 'red'}>{health?.status || 'unknown'}</Badge>}
      />

      <Card hover={false} className="p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isHealthy ? <CheckCircle className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
              {isHealthy ? 'All systems operational' : 'Service degraded'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Unavailable'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card hover={false} className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-slate-950 dark:text-white"><Server className="h-5 w-5 text-primary" /> API Server</h3>
            <Badge tone={isHealthy ? 'green' : 'red'}>{isHealthy ? 'Online' : 'Check logs'}</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Uptime</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{health?.info.uptime}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Memory Usage</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{health?.info.memory}</span>
            </div>
          </div>
        </Card>

        <Card hover={false} className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-slate-950 dark:text-white"><Database className="h-5 w-5 text-primary" /> Database</h3>
            <Badge tone={health?.info.database.status === 'up' ? 'green' : 'red'}>{health?.info.database.status || 'unknown'}</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Driver</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{health?.info.database.host}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Latency</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{health?.info.database.latency}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth;
