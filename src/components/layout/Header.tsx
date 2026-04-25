import { Menu, Moon, Sun, Bell, Search, Maximize2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 lg:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-[var(--hover-bg)] lg:hidden cursor-pointer">
        <Menu size={20} className="text-[var(--text-primary)]" />
      </button>

      <h1 className="text-[15px] font-semibold text-[var(--text-primary)] lg:hidden">{title}</h1>

      {/* Search bar */}
      <div className="relative hidden lg:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search..."
          className="w-56 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-[7px] pl-9 pr-10 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:bg-[var(--input-bg)] transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--border-color)] bg-[var(--card-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
          /
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 hover:bg-[var(--hover-bg)] cursor-pointer transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon size={18} className="text-[var(--text-secondary)]" />
          ) : (
            <Sun size={18} className="text-amber-400" />
          )}
        </button>

        <button
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
          }}
          className="hidden rounded-full p-2 hover:bg-[var(--hover-bg)] lg:flex cursor-pointer transition-colors"
          title="Toggle fullscreen"
        >
          <Maximize2 size={18} className="text-[var(--text-secondary)]" />
        </button>

        <button className="relative rounded-full p-2 hover:bg-[var(--hover-bg)] cursor-pointer transition-colors">
          <Bell size={18} className="text-[var(--text-secondary)]" />
          <span className="absolute right-1 top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary-400 px-1 text-[9px] font-bold text-white">
            4
          </span>
        </button>

        <div className="ml-1.5 h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-primary-400 ring-2 ring-primary-100 dark:ring-primary-900 transition-all hover:ring-primary-200">
          <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-white">
            K
          </div>
        </div>
      </div>
    </header>
  );
}
