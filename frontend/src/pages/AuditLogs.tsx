import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';
import { ScrollText, Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';

const AuditLogs: React.FC = () => {
  const [page, setPage] = React.useState(0);
  const limit = 20;

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => getAuditLogs(limit, page * limit),
  });

  React.useEffect(() => {
    if (error) {
      toast.error('Failed to load audit logs');
    }
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
          <ScrollText className="w-10 h-10 text-primary" /> Audit Logs
        </h1>
        <p className="text-slate-500 text-lg font-medium">Trace all user actions and system events.</p>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-medium">No audit logs available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100/80">
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Timestamp</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Action</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">User</th>
                  <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {log.user?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{log.user?.name || log.user?.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-sm text-slate-500 font-medium">
                Page {page + 1}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < limit}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
