import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ onSearch, className = '', ...props }, ref) {
    return (
      <div className={`relative ${className}`}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          ref={ref}
          type="text"
          className="w-full h-10 rounded-md bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 dark:focus:border-cyan-400/60 transition-colors outline-none"
          onChange={e => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);
