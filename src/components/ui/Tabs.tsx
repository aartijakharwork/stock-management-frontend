import { useState, useRef, useEffect, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  size?: 'sm' | 'md';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'pills', size = 'md' }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (variant !== 'underline') return;
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab, variant]);

  if (variant === 'underline') {
    return (
      <div className="relative" role="tablist">
        <div
          ref={containerRef}
          className="flex gap-0 overflow-x-auto border-b border-gray-200 dark:border-gray-800 -mx-1 px-1"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
        <span
          className="absolute bottom-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-300 ease-out"
          style={indicatorStyle}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      role="tablist"
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200 ${
            size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
          } ${
            activeTab === tab.id
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null;
  return (
    <div role="tabpanel" className="animate-tab-enter">
      {children}
    </div>
  );
}
