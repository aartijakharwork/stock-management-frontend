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
        <label htmlFor={inputId} className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-10 rounded-md bg-white dark:bg-white/5 border px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-gray-50 dark:focus:bg-white/10 transition-colors outline-none ${error ? 'border-red-400 focus:border-red-500 dark:border-red-500/40 dark:focus:border-red-500/60' : 'border-gray-200 focus:border-cyan-500 dark:border-white/10 dark:focus:border-cyan-400/60'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-700 dark:text-red-300">{error}</span>}
    </div>
  );
}
