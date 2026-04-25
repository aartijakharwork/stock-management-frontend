import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-white/5 dark:bg-black/50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 lg:pl-72 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>

        <h1 className="lg:hidden text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>

        <div className="hidden lg:block relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            strokeWidth={1.8}
          />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white border border-gray-200 rounded-md pl-9 pr-3 h-9 text-[13px] text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors w-72 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:border-cyan-400/60"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun size={20} strokeWidth={1.8} className="text-amber-300" />
            ) : (
              <Moon size={20} strokeWidth={1.8} />
            )}
          </button>

          <button
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={1.8} />
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan-600 dark:bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
              4
            </span>
          </button>

          <button
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-cyan-200 border border-gray-200 dark:from-purple-500/40 dark:to-cyan-500/40 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white text-[13px] font-bold transition-colors hover:border-gray-300 dark:hover:border-white/20"
            aria-label="Account"
          >
            K
          </button>
        </div>
      </div>
    </header>
  );
}
