import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { ToastType } from '../../types';

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
  error: 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in ${styles[toast.type]}`}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
