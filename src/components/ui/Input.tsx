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
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-[13px]
          text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors
          focus:border-primary-400 focus:ring-1 focus:ring-primary-400
          ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-[12px] text-red-500">{error}</span>}
    </div>
  );
}
