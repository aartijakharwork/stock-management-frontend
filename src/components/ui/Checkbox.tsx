import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  id?: string;
}

export function Checkbox({ checked, onChange, label, description, disabled, indeterminate, id }: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} group`}
    >
      <button
        id={checkboxId}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`mt-0.5 shrink-0 w-[18px] h-[18px] rounded flex items-center justify-center border-2 transition-all duration-150 ${
          checked || indeterminate
            ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {(checked || indeterminate) && (
          <span className="animate-check-pop">
            {indeterminate ? <Minus size={12} className="text-white" strokeWidth={3} /> : <Check size={12} className="text-white" strokeWidth={3} />}
          </span>
        )}
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">{label}</span>}
          {description && <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{description}</span>}
        </div>
      )}
    </label>
  );
}
