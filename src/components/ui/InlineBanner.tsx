import type { ReactNode } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

type Tone = 'info' | 'warning' | 'error' | 'success';

interface InlineBannerProps {
  tone?: Tone;
  title: string;
  description?: ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
}

const tones: Record<Tone, { wrap: string; icon: ReactNode; iconCol: string }> = {
  info:    { wrap: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',       icon: <Info size={18} />,         iconCol: 'text-blue-600 dark:text-blue-400' },
  warning: { wrap: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',   icon: <AlertTriangle size={18} />, iconCol: 'text-amber-600 dark:text-amber-400' },
  error:   { wrap: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30',           icon: <AlertCircle size={18} />,   iconCol: 'text-red-600 dark:text-red-400' },
  success: { wrap: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30', icon: <CheckCircle2 size={18} />, iconCol: 'text-emerald-600 dark:text-emerald-400' },
};

export function InlineBanner({ tone = 'info', title, description, onRetry, onDismiss, retryLabel = 'Retry', className = '' }: InlineBannerProps) {
  const t = tones[tone];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${t.wrap} ${className}`}>
      <span className={`shrink-0 mt-0.5 ${t.iconCol}`}>{t.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        {description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>{retryLabel}</Button>}
        {onDismiss && (
          <button onClick={onDismiss} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
