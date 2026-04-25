import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ onSearch, className = '', ...props }, ref) {
    return (
      <div className={`relative ${className}`}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          ref={ref}
          type="text"
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] py-2 pl-9 pr-4 text-[13px]
            text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors
            focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
          onChange={e => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);
