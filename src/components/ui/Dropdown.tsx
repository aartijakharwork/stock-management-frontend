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
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:focus:border-emerald-500 transition-colors outline-none ${className}`}
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
