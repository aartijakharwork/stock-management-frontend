import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface UnsavedChangesGuardProps {
  hasChanges: boolean;
  message?: string;
}

export function UnsavedChangesGuard({ hasChanges, message = 'You have unsaved changes. Are you sure you want to leave?' }: UnsavedChangesGuardProps) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    hasChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  if (blocker.state !== 'blocked') return null;

  return (
    <Modal open title="Unsaved changes" onClose={() => blocker.reset()} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="text-amber-500" size={22} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">{message}</p>
        <div className="flex gap-3 mt-6 w-full">
          <Button variant="secondary" className="flex-1" onClick={() => blocker.reset()}>
            Stay
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => blocker.proceed()}>
            Leave
          </Button>
        </div>
      </div>
    </Modal>
  );
}
