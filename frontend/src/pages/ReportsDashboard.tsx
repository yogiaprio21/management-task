import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { getReports } from '../api/reports';
import { getSprints } from '../api/sprints';
import { BarChart3, Loader2, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '../ui/Card';

const ReportsDashboard: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', selectedProjectId],
    queryFn: () => getReports(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const { data: sprints, isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints', selectedProjectId],
    queryFn: () => getSprints(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  // Mock data for Burn Down and Velocity charts since actual task weight/burndown isn't in API yet
  const velocityData = sprints?.map((_, idx) => ({
    name: `Sprint ${idx + 1}`,
    completed: Math.floor(Math.random() * 20) + 10, // Mock completed points
    planned: Math.floor(Math.random() * 5) + 20,   // Mock planned points
  })) || [];

  if (projectsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-primary" /> Reports & Analytics
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg font-medium">Analyze team velocity and track daily updates.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6">Team Velocity</h3>
           {sprintsLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : velocityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Planned Points" />
                  <Bar dataKey="completed" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Completed Points" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">No sprints to show velocity.</div>
          )}
        </Card>

        <Card className="p-6 h-full flex flex-col">
          <h3 className="text-xl font-bold mb-6">Daily & Weekly Reports</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
             {reportsLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
             ) : reports?.length === 0 ? (
               <div className="text-center text-slate-400 mt-10">No reports generated yet.</div>
             ) : (
               reports?.map(report => (
                 <div key={report.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                        report.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                       }`}>
                         {report.type}
                       </span>
                       <span className="text-xs text-slate-400 flex items-center gap-1">
                         <Calendar className="w-3 h-3" /> {new Date(report.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{report.content}</p>
                 </div>
               ))
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsDashboard;
