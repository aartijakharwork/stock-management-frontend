import { Calendar } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function DatePicker({ label, error, className = '', id, ...props }: DatePickerProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="date"
          className={`w-full h-10 rounded-lg bg-white dark:bg-gray-800 border px-3 pr-10 text-sm text-gray-900 dark:text-white transition-colors outline-none appearance-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-500/40'
              : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:focus:border-emerald-500'
          } ${className}`}
          {...props}
        />
        <Calendar
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
      </div>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
