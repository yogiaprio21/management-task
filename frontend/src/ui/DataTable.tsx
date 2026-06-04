import React from 'react';
import { cn } from './utils';

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

interface DataTableProps<T> {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  getRowKey: (row: T) => string;
  empty?: React.ReactNode;
}

export function DataTable<T>({ rows, columns, getRowKey, empty }: DataTableProps<T>) {
  if (!rows.length) {
    return <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{empty || 'No data available.'}</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn('px-4 py-3', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-top text-slate-700 dark:text-slate-200', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)} className="space-y-3 p-4">
            {columns.filter((column) => !column.hideOnMobile).map((column) => (
              <div key={column.key} className="grid gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.header}</span>
                <div className="text-sm text-slate-800 dark:text-slate-100">{column.cell(row)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
