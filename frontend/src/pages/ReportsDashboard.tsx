import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, BarChart3, Calendar, CheckCircle2, Loader2, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getReports, getReportsAnalytics } from '../api/reports';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { Badge, statusTone } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import ProjectSwitcher from '../components/ProjectSwitcher';

const ReportsDashboard: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', selectedProjectId],
    queryFn: () => getReports(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['reports-analytics', selectedProjectId],
    queryFn: () => getReportsAnalytics(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Reports & Analytics"
        description="Track delivery health, sprint velocity, workload, and team updates using live project data."
        icon={<BarChart3 className="h-5 w-5" />}
        actions={<ProjectSwitcher value={selectedProjectId} onChange={setSelectedProjectId} />}
      />

      {!selectedProjectId ? (
        <EmptyState
          icon={<BarChart3 className="h-7 w-7" />}
          title="No project selected"
          description="Create or select a project to view analytics."
        />
      ) : analyticsLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Tasks', value: analytics?.summary.totalTasks || 0, icon: Activity, tone: 'blue' },
              { label: 'Completed', value: analytics?.summary.completedTasks || 0, icon: CheckCircle2, tone: 'green' },
              { label: 'Active Sprints', value: analytics?.summary.activeSprints || 0, icon: Calendar, tone: 'purple' },
              { label: 'Overdue', value: analytics?.summary.overdueTasks || 0, icon: AlertTriangle, tone: 'red' },
            ].map((stat) => (
              <Card key={stat.label} hover={false} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 text-primary dark:bg-slate-900">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card hover={false} className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Team Velocity</h3>
                <Badge tone="blue">Live data</Badge>
              </div>
              {analytics?.velocity.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.velocity} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#F8FAFC' }} />
                      <Bar dataKey="planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Planned" />
                      <Bar dataKey="completed" fill="#2563EB" radius={[4, 4, 0, 0]} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No sprint data" description="Create sprints and tasks to generate velocity charts." />
              )}
            </Card>

            <Card hover={false} className="p-5">
              <h3 className="mb-5 text-lg font-bold text-slate-950 dark:text-white">Task Status</h3>
              <div className="space-y-3">
                {(analytics?.statusCounts || []).map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                    <Badge tone={statusTone(item.status)}>{item.status.replace('_', ' ')}</Badge>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card hover={false} className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Workload</h3>
              </div>
              <div className="space-y-3">
                {(analytics?.workload || []).length ? analytics?.workload.map((item) => (
                  <div key={item.name} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</span>
                      <span className="text-slate-500">{item.done}/{item.total} done</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-primary" style={{ width: `${item.total ? (item.done / item.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                )) : <EmptyState title="No workload yet" description="Assign tasks to see workload distribution." />}
              </div>
            </Card>

            <Card hover={false} className="p-5">
              <h3 className="mb-5 text-lg font-bold text-slate-950 dark:text-white">Daily & Weekly Reports</h3>
              {reportsLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : reports.length ? (
                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge tone={report.type === 'daily' ? 'blue' : 'purple'}>{report.type}</Badge>
                        <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{report.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No reports yet" description="Publish daily or weekly updates from Project Detail." />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsDashboard;
