import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'info';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  tone?: Tone;
  className?: string;
  compact?: boolean;
}

const toneIconBg: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = 'neutral',
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-10 px-4' : 'py-14 px-6'
      } ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-2xl ${
          compact ? 'w-12 h-12' : 'w-16 h-16'
        } ${toneIconBg[tone]}`}
      >
        {icon}
      </div>
      <h3 className={`${compact ? 'mt-3 text-sm' : 'mt-4 text-base'} font-semibold text-gray-900 dark:text-white`}>
        {title}
      </h3>
      {description && (
        <p className={`${compact ? 'mt-1 text-xs' : 'mt-1.5 text-sm'} max-w-sm text-gray-500 dark:text-gray-400`}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
