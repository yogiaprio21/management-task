import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';
import { ScrollText, Loader2, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { DataTable, type DataTableColumn } from '../ui/DataTable';
import type { AuditLog } from '../types';

const parseDetails = (details?: string) => {
  if (!details) return [];
  try {
    const parsed = JSON.parse(details);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [{ label: 'value', value: String(details) }];
    }
    return Object.entries(parsed)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .slice(0, 6)
      .map(([label, value]) => ({
        label,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));
  } catch {
    return [{ label: 'details', value: details }];
  }
};

const auditColumns: Array<DataTableColumn<AuditLog>> = [
  {
    key: 'timestamp',
    header: 'Timestamp',
    cell: (log) => <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{new Date(log.createdAt).toLocaleString()}</span>,
  },
  {
    key: 'action',
    header: 'Action',
    cell: (log) => (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{log.action.replace('_', ' ')}</span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{log.entityType}</span>
      </div>
    ),
  },
  {
    key: 'user',
    header: 'User',
    cell: (log) => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
          {log.user?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{log.user?.name || 'System'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{log.user?.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'changes',
    header: 'Changes',
    cell: (log) => {
      const changes = parseDetails(log.details);
      if (!changes.length) return <span className="text-slate-500 dark:text-slate-400">No field changes</span>;
      return (
        <div className="flex max-w-xl flex-wrap gap-2">
          {changes.map((change) => (
            <span key={`${change.label}-${change.value}`} className="max-w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <strong className="mr-1">{change.label}:</strong>
              <span className="break-all">{change.value}</span>
            </span>
          ))}
        </div>
      );
    },
  },
];

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
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
          <ScrollText className="h-7 w-7 text-primary" /> Audit Logs
        </h1>
        <p className="text-base font-medium text-slate-600 dark:text-slate-300">Trace all user actions and system events.</p>
      </div>

      <div className="surface-panel overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
        ) : !logs || logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-300">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-medium">No audit logs available.</p>
          </div>
        ) : (
          <>
            <DataTable rows={logs} columns={auditColumns} getRowKey={(log) => log.id} />

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
