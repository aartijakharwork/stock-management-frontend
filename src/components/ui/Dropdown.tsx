import type { SelectHTMLAttributes } from 'react';

interface Option {
  label: string;
  value: string;
}

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  placeholder?: string;
}

export function Dropdown({ label, options, placeholder, className = '', id, ...props }: DropdownProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 rounded-md bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 text-sm text-gray-900 dark:text-white focus:border-cyan-500 dark:focus:border-cyan-400/60 transition-colors outline-none ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
