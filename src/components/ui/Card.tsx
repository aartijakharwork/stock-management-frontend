import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  animate?: boolean;
  animationDelay?: number;
}

export function Card({ children, className = '', padding = true, animate, animationDelay }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] transition-shadow duration-300
        ${padding ? 'p-6' : ''} ${animate ? 'animate-fade-in-up' : ''} ${className}`}
      style={{
        boxShadow: 'var(--shadow-card)',
        ...(animate && animationDelay ? { animationDelay: `${animationDelay}ms` } : {}),
      }}
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
  iconBg?: string;
  delay?: number;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, trend, trendUp, iconBg, delay = 0, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`animate-fade-in-up group rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        boxShadow: 'var(--shadow-card)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{title}</p>
          <p className="animate-count-up mt-2 text-[26px] font-bold leading-none text-[var(--text-primary)]">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold
                ${trendUp
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                }`}>
                {trendUp ? '↑' : '↓'} {trend}
              </span>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${iconBg || 'bg-primary-50 text-primary-500 dark:bg-primary-400/10 dark:text-primary-400'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
