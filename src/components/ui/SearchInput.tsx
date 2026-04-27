import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ onSearch, className = '', ...props }, ref) {
    return (
      <div className={`relative ${className}`}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={ref}
          type="text"
          className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:focus:border-emerald-500 transition-colors outline-none"
          onChange={e => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);
