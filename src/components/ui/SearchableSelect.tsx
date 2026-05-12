import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';

export interface SearchableOption {
  label: string;
  value: string;
  sublabel?: string;
  disabled?: boolean;
}

interface BaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  /** Width of the trigger. Defaults to "auto" — set to "full" to fill parent. */
  width?: 'auto' | 'full';
  size?: 'sm' | 'md';
  /** Show a clear button when a value is selected. */
  clearable?: boolean;
  /** Optional renderer for an option row. Defaults to label/sublabel. */
  renderOption?: (opt: SearchableOption, isActive: boolean) => ReactNode;
  /** Optional label above the trigger. */
  label?: string;
  /** When true, panel matches trigger width. */
  fullWidthPanel?: boolean;
  disabled?: boolean;
  /** Optional id, mainly for label association. */
  id?: string;
}

interface StaticProps extends BaseProps {
  options: SearchableOption[];
  loadOptions?: never;
  /** Min characters before filtering (defaults to 0 — show all). */
  minSearchChars?: number;
}

interface AsyncProps extends BaseProps {
  loadOptions: (query: string) => Promise<SearchableOption[]>;
  options?: never;
  /** Min characters before searching (defaults to 1). */
  minSearchChars?: number;
  /** Debounce in ms (defaults to 220). */
  debounceMs?: number;
  /** Initial options to show when panel opens with no query. */
  defaultOptions?: SearchableOption[];
}

export type SearchableSelectProps = StaticProps | AsyncProps;

function isAsync(p: SearchableSelectProps): p is AsyncProps {
  return typeof (p as AsyncProps).loadOptions === 'function';
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    value, onChange, placeholder = 'Select…', emptyText = 'No matches',
    className = '', width = 'full', size = 'md', clearable = false,
    renderOption, label, fullWidthPanel = true, disabled, id,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [asyncOptions, setAsyncOptions] = useState<SearchableOption[]>(
    isAsync(props) ? (props.defaultOptions ?? []) : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelAlign, setPanelAlign] = useState<'left' | 'right'>('left');

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine the option list
  const options: SearchableOption[] = useMemo(() => {
    if (isAsync(props)) return asyncOptions;
    const all = props.options;
    const minChars = props.minSearchChars ?? 0;
    const q = query.trim().toLowerCase();
    if (!q || q.length < minChars) return all;
    return all.filter(o =>
      o.label.toLowerCase().includes(q)
      || o.value.toLowerCase().includes(q)
      || (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, query, asyncOptions]);

  // Async loader with debounce
  useEffect(() => {
    if (!open || !isAsync(props)) return;
    const minChars = props.minSearchChars ?? 1;
    const debounce = props.debounceMs ?? 220;
    const q = query.trim();
    if (q.length < minChars) {
      setAsyncOptions(props.defaultOptions ?? []);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      props.loadOptions(q).then(opts => {
        if (cancelled) return;
        setAsyncOptions(opts);
      }).catch(err => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load options');
        setAsyncOptions([]);
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, debounce);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Outside click to close
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Keep activeIndex in range as filter changes
  useEffect(() => {
    if (activeIndex >= options.length) setActiveIndex(0);
  }, [options.length, activeIndex]);

  // Focus input when opening + decide whether to anchor the panel left or
  // right of the trigger based on which side has more room. Without this the
  // panel can extend past the page edge and get clipped by ancestor
  // overflow-x-hidden.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const PANEL_MIN = 256; // matches min-w-[16rem] below
        const spaceRight = window.innerWidth - rect.left;
        const spaceLeft = rect.right;
        // Flip to right-aligned when the panel wouldn't fit growing rightward
        // but does fit growing leftward.
        if (spaceRight < PANEL_MIN && spaceLeft >= PANEL_MIN) {
          setPanelAlign('right');
        } else {
          setPanelAlign('left');
        }
      }
    }
    if (!open) { setQuery(''); setActiveIndex(0); }
  }, [open]);

  const selected = useMemo(() => {
    if (isAsync(props)) {
      // Try defaults / current loaded set
      return [...(props.defaultOptions ?? []), ...asyncOptions].find(o => o.value === value);
    }
    return props.options.find(o => o.value === value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, asyncOptions, value]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt && !opt.disabled) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const triggerHeight = size === 'sm' ? 'h-8' : 'h-10';
  const triggerText = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={rootRef} className={`relative ${width === 'full' ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`group inline-flex items-center w-full ${triggerHeight} rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 pl-3 pr-2 ${triggerText} text-left text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`flex-1 truncate ${selected ? '' : 'text-gray-400 dark:text-gray-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Clear"
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown size={14} className={`ml-1 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-[60] mt-1 ${panelAlign === 'right' ? 'right-0' : 'left-0'} ${fullWidthPanel ? 'w-full' : 'min-w-[16rem]'} rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden`}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {loading && <Loader2 size={14} className="text-gray-400 animate-spin" />}
          </div>

          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {error ? (
              <li className="px-3 py-3 text-xs text-red-600 dark:text-red-400 text-center">{error}</li>
            ) : options.length === 0 && !loading ? (
              <li className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">{emptyText}</li>
            ) : (
              options.map((opt, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value || `__${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(opt, isActive)
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{opt.sublabel}</p>
                        )}
                      </div>
                    )}
                    {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
