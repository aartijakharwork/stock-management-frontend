import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  animate?: boolean;
  animationDelay?: number;
}

const delayClassMap: Record<number, string> = {
  1: 'animate-fade-in-up-1',
  2: 'animate-fade-in-up-2',
  3: 'animate-fade-in-up-3',
  4: 'animate-fade-in-up-4',
};

function resolveAnimationClass(animate?: boolean, animationDelay?: number) {
  if (!animate) return '';
  if (animationDelay && delayClassMap[animationDelay]) {
    return delayClassMap[animationDelay];
  }
  return 'animate-fade-in-up';
}

export function Card({ children, className = '', padding = true, animate, animationDelay }: CardProps) {
  const animationClass = resolveAnimationClass(animate, animationDelay);
  return (
    <div
      className={`relative bg-white border border-gray-200 rounded-xl backdrop-blur-sm transition-colors hover:border-gray-300 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:border-white/20 ${padding ? 'p-5 sm:p-6' : ''} ${animationClass} ${className}`}
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

export function StatCard({ title, value, icon, trend, trendUp, delay, onClick }: StatCardProps) {
  const animationClass = delay && delayClassMap[delay] ? delayClassMap[delay] : 'animate-fade-in-up';
  return (
    <div
      onClick={onClick}
      className={`relative bg-white border border-gray-200 rounded-xl backdrop-blur-sm p-5 sm:p-6 transition-colors hover:border-gray-300 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:border-white/20 ${animationClass} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">{title}</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
          {trend && (
            <p className={`mt-2 text-xs ${trendUp ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              {trendUp ? '+' : ''}{trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 border border-gray-200 flex items-center justify-center text-purple-700 dark:from-purple-500/20 dark:to-cyan-500/20 dark:border-white/10 dark:text-purple-300 shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
