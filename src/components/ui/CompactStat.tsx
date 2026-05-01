import type { ReactNode } from 'react';

export type CompactStatTone = 'emerald' | 'blue' | 'amber' | 'red' | 'gray' | 'purple';
export type CompactStatSubtitleTone = 'good' | 'warn' | 'bad' | 'muted';

interface CompactStatProps {
  icon: ReactNode;
  tone: CompactStatTone;
  title: string;
  value: string;
  subtitle?: string;
  subtitleTone?: CompactStatSubtitleTone;
  onClick?: () => void;
  className?: string;
}

const TONE_BG: Record<CompactStatTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  blue:    'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
  amber:   'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  red:     'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-500/20',
  purple:  'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/20',
  gray:    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

const SUBTITLE_CLASS: Record<CompactStatSubtitleTone, string> = {
  good:  'text-emerald-600 dark:text-emerald-400',
  warn:  'text-amber-600 dark:text-amber-400',
  bad:   'text-red-600 dark:text-red-400',
  muted: 'text-gray-500 dark:text-gray-400',
};

export function CompactStat({
  icon, tone, title, value, subtitle, subtitleTone = 'muted', onClick, className = '',
}: CompactStatProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 transition-colors ${onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-700' : ''} ${className}`}
    >
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${TONE_BG[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums leading-tight">{value}</p>
        {subtitle && (
          <p className={`text-[10px] font-medium leading-tight ${SUBTITLE_CLASS[subtitleTone]}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
