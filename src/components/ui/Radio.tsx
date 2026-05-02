interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

export function RadioGroup({ name: _name, value, onChange, options, label, direction = 'vertical', disabled }: RadioGroupProps) {
  return (
    <fieldset className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
      {label && <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</legend>}
      <div className={`flex gap-3 ${direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}>
        {options.map(opt => (
          <label
            key={opt.value}
            className={`inline-flex items-start gap-3 group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <button
              type="button"
              role="radio"
              aria-checked={value === opt.value}
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.value)}
              className={`mt-0.5 shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                value === opt.value
                  ? 'border-emerald-600 dark:border-emerald-500'
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {value === opt.value && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-check-pop" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">{opt.label}</span>
              {opt.description && <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{opt.description}</span>}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
