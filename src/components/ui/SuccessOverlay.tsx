import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  duration?: number;
}

export function SuccessOverlay({
  open,
  onClose,
  title = 'Done!',
  message,
  duration = 1800,
}: SuccessOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center animate-backdrop-in">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-3 animate-success-pop">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-emerald-400/60 animate-success-ring" />
        </div>
        <p className="text-lg font-bold text-white drop-shadow-lg">{title}</p>
        {message && <p className="text-sm text-white/80 drop-shadow">{message}</p>}
      </div>
    </div>
  );
}
