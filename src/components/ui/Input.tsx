import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-10 rounded-lg bg-white dark:bg-gray-800 border px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors outline-none ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-500/40'
            : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:focus:border-emerald-500'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
