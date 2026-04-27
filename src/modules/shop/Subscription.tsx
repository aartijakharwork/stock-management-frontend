import { Check, CreditCard, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { subscriptionPlans } from '../../data/shop-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const CURRENT_PLAN_NAME = 'Standard';
const RENEWAL_DATE = '15 May 2026';

export function ShopSubscription() {
  const { addToast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">Choose the plan that fits your shop.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your plan</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{CURRENT_PLAN_NAME}</h2>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Renews on {RENEWAL_DATE}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => addToast('info', 'Billing management coming soon')}>Manage billing</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {subscriptionPlans.map(plan => {
          const isCurrent = plan.name === CURRENT_PLAN_NAME;
          return (
            <div key={plan.id} className={`relative bg-white dark:bg-gray-900 border rounded-xl p-5 sm:p-6 flex flex-col ${
              plan.recommended ? 'border-emerald-300 dark:border-emerald-500/30 ring-1 ring-emerald-100 dark:ring-emerald-500/10' : 'border-gray-200 dark:border-gray-800'
            }`}>
              {plan.recommended && (
                <span className="absolute top-4 right-4">
                  <Badge variant="success">Recommended</Badge>
                </span>
              )}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(plan.price)}</span>
                <span className="text-sm text-gray-500">/ {plan.period}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="secondary" size="lg" className="w-full" disabled>Current plan</Button>
                ) : plan.recommended ? (
                  <Button variant="primary" size="lg" className="w-full" onClick={() => addToast('success', `Switched to ${plan.name}`)}>Choose {plan.name}</Button>
                ) : (
                  <Button variant="secondary" size="lg" className="w-full" onClick={() => addToast('success', `Switched to ${plan.name}`)}>Switch to {plan.name}</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Need help choosing?</h2>
              <p className="text-sm text-gray-500 mt-0.5">Tell us about your shop size and we'll recommend the right plan.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => addToast('info', 'Support request sent')}>Contact support</Button>
        </div>
      </Card>
    </div>
  );
}
