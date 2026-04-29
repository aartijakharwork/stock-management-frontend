import { useState } from 'react';
import { Check, CreditCard, HelpCircle, Crown, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { subscriptionPlans } from '../../data/shop-dummy';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import type { SubscriptionPlan } from '../../types';

const CURRENT_PLAN_ID = '1';
const RENEWAL_DATE = '15 May 2026';

function PlanCard({ plan, isCurrent, onChoose }: { plan: SubscriptionPlan; isCurrent: boolean; onChoose: () => void }) {
  const isRecommended = plan.recommended;
  const hasTag = !!plan.tag;

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 border rounded-xl p-5 sm:p-6 flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        isRecommended
          ? 'border-emerald-300 dark:border-emerald-500/30 ring-2 ring-emerald-100 dark:ring-emerald-500/10'
          : hasTag
            ? 'border-amber-300 dark:border-amber-500/30 ring-1 ring-amber-100 dark:ring-amber-500/10'
            : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isRecommended && (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          {hasTag && !isRecommended && (
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Crown size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isRecommended && <Badge variant="success">Recommended</Badge>}
          {hasTag && <Badge variant="warning">{plan.tag}</Badge>}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(plan.price)}</span>
          <span className="text-sm text-gray-500">/ {plan.period}</span>
        </div>
        {plan.perMonthPrice < plan.price && (
          <p className="mt-1 text-xs text-gray-500">
            ~{formatCurrency(plan.perMonthPrice)}/month
          </p>
        )}
      </div>

      {plan.savingsLabel && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            {plan.savingsLabel}
          </span>
        </div>
      )}

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
        ) : isRecommended ? (
          <Button variant="primary" size="lg" className="w-full" onClick={onChoose}>Upgrade to {plan.name}</Button>
        ) : (
          <Button variant="secondary" size="lg" className="w-full" onClick={onChoose}>Choose {plan.name}</Button>
        )}
      </div>
    </div>
  );
}

export function ShopSubscription() {
  const [currentPlanId, setCurrentPlanId] = useState(CURRENT_PLAN_ID);
  const { addToast } = useToast();

  const currentPlan = subscriptionPlans.find(p => p.id === currentPlanId);

  const handleChoose = (plan: SubscriptionPlan) => {
    setCurrentPlanId(plan.id);
    addToast('success', `Switched to ${plan.name}`, `Your plan has been updated.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">Choose the plan that fits your shop.</p>
      </div>

      {currentPlan && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Your plan</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentPlan.name}</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(currentPlan.price)} / {currentPlan.period} · Renews on {RENEWAL_DATE}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => addToast('info', 'Billing management coming soon')}>Manage billing</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {subscriptionPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === currentPlanId}
            onChoose={() => handleChoose(plan)}
          />
        ))}
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
