import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { ToastType } from '../../types';

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

const leftAccent: Record<ToastType, string> = {
  success: 'before:bg-emerald-500',
  warning: 'before:bg-amber-500',
  error: 'before:bg-red-500',
  info: 'before:bg-blue-500',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              relative flex items-start gap-3
              rounded-xl border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-900
              px-4 py-3.5
              shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
              animate-slide-in
              overflow-hidden
              before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl
              ${leftAccent[toast.type]}
            `}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 -mr-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
