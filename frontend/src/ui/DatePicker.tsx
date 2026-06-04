import React, { useMemo, useState } from 'react';
import { addMonths, format, getDay, isSameDay, parseISO, startOfMonth, subMonths } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './utils';

interface DatePickerProps {
  id?: string;
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const toDateValue = (date: Date) => format(date, 'yyyy-MM-dd');

export const DatePicker: React.FC<DatePickerProps> = ({ id, label, value, onChange, disabled }) => {
  const selectedDate = value ? parseISO(value) : undefined;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(selectedDate || new Date()));

  const days = useMemo(() => {
    const firstDayOffset = getDay(month);
    const dates: Array<Date | null> = Array.from({ length: firstDayOffset }, () => null);
    const cursor = new Date(month);
    while (cursor.getMonth() === month.getMonth()) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [month]);

  return (
    <div className="relative w-full space-y-1.5">
      {label && <label htmlFor={id} className="ml-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((state) => !state)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
      >
        <span>{selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}</span>
        <Calendar className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-[292px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMonth((current) => subMonths(current, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{format(month, 'MMMM yyyy')}</span>
            <button type="button" className="rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMonth((current) => addMonths(current, 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-slate-500">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              day ? (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(toDateValue(day));
                    setOpen(false);
                  }}
                  className={cn(
                    'h-8 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                    selectedDate && isSameDay(day, selectedDate) && 'bg-primary text-white hover:bg-primary dark:text-white',
                  )}
                >
                  {format(day, 'd')}
                </button>
              ) : <span key={`blank-${index}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
