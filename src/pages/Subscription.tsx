import { Check, CreditCard, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { subscriptionPlans } from '../data/dummy';
import { formatCurrency } from '../utils/formatters';

const CURRENT_PLAN_NAME = 'Standard';
const RENEWAL_DATE = '15 May 2026';

export function Subscription() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Choose the plan that fits your shop</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-500/20 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
              <CreditCard size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Your plan</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{CURRENT_PLAN_NAME}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Active
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Renews on {RENEWAL_DATE}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Manage billing
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {subscriptionPlans.map(plan => {
          const isCurrent = plan.name === CURRENT_PLAN_NAME;
          const borderCls = plan.recommended ? 'border-cyan-300 dark:border-cyan-400/40' : 'border-gray-200 dark:border-white/10';
          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-white/5 border ${borderCls} rounded-xl backdrop-blur-sm p-5 sm:p-6 flex flex-col transition-colors hover:border-gray-300 dark:hover:border-white/20`}
            >
              {plan.recommended && (
                <span className="absolute top-4 right-4 border border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-300 text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-md">
                  Recommended
                </span>
              )}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-xs text-gray-500">/ {plan.period}</span>
                </div>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="secondary" size="lg" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : plan.recommended ? (
                  <Button variant="primary" size="lg" className="w-full">
                    Choose {plan.name}
                  </Button>
                ) : (
                  <Button variant="secondary" size="lg" className="w-full">
                    Switch to {plan.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-500/20 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
              <HelpCircle size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Not sure which to pick?</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Need help choosing?</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Tell us about your shop size and we&apos;ll recommend the right plan.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Contact support
          </Button>
        </div>
      </Card>
    </div>
  );
}
