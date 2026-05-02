import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
  /** When true, card fades/slides in on mount. */
  animate?: boolean;
  /** Delay in ms for staggered animations. */
  animationDelay?: number;
}

export function Card({ children, className = '', padding = true, onClick, animate: _animate, animationDelay: _animationDelay }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-800 ${padding ? 'p-5 sm:p-6' : ''} ${onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 hover-lift' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  onClick?: () => void;
  /** Optional CSS classes for the icon container background/color. */
  iconBg?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, onClick, iconBg }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-5 sm:p-6 dark:bg-gray-900 dark:border-gray-800 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 hover-lift' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
          {trend && (
            <p className={`mt-1.5 text-xs font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg ?? 'bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
