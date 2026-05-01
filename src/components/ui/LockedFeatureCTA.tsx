import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Card } from './Card';

interface LockedFeatureCTAProps {
  feature: string;
  description?: string;
  requiredPlan?: 'Half-Yearly' | 'Yearly' | 'Pro';
  ctaTo?: string;
}

export function LockedFeatureCTA({ feature, description, requiredPlan = 'Half-Yearly', ctaTo = '/shop/subscription' }: LockedFeatureCTAProps) {
  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-500/10 dark:via-gray-900 dark:to-emerald-500/5 border-emerald-200 dark:border-emerald-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
          <Lock size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Premium feature</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{feature}</h3>
          {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
          <p className="mt-2 text-xs text-gray-500">
            Unlock with the <span className="font-semibold text-emerald-700 dark:text-emerald-400">{requiredPlan}</span> plan or higher.
          </p>
        </div>
        <Link to={ctaTo} className="shrink-0">
          <Button variant="primary" icon={<Sparkles size={16} />}>Upgrade plan</Button>
        </Link>
      </div>
    </Card>
  );
}
