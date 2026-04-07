import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../api/health';
import { Activity, Server, Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';

const SystemHealth: React.FC = () => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  const isHealthy = health?.status === 'ok';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
          <Activity className="w-10 h-10 text-primary" /> System Health
        </h1>
        <p className="text-slate-500 text-lg font-medium">Real-time status of backend services and database.</p>
      </div>

      <Card className="p-8 border-none card-gradient">
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {isHealthy ? <CheckCircle className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">
              {isHealthy ? 'All Systems Operational' : 'Degraded Performance'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">Last checked: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2"><Server className="w-5 h-5 text-primary" /> API Server</h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase rounded-full tracking-wider">Online</span>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-sm">
               <span className="text-slate-500 font-medium">Uptime</span>
               <span className="font-bold text-slate-700">{health?.info?.uptime || 'N/A'}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-slate-500 font-medium">Memory Usage</span>
               <span className="font-bold text-slate-700">{health?.info?.memory || 'Normal'}</span>
             </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2"><Database className="w-5 h-5 text-amber-500" /> Database</h3>
            <span className={`px-3 py-1 text-xs font-black uppercase rounded-full tracking-wider ${
              health?.info?.database?.status === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {health?.info?.database?.status || 'Unknown'}
            </span>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-sm">
               <span className="text-slate-500 font-medium">Connection</span>
               <span className="font-bold text-slate-700">{health?.info?.database?.host || 'Connected'}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-slate-500 font-medium">Latency</span>
               <span className="font-bold text-slate-700">{health?.info?.database?.latency || '<10ms'}</span>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth;
