import { useMemo, useState } from 'react';
import {
  Check, CreditCard, HelpCircle, Crown, Sparkles,
  Receipt as ReceiptIcon, Package, Users, Clock, X, ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  subscriptionPlans, bills, staffMembers,
} from '../../data/shop-dummy';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useShopCatalog } from '../../context/ShopCatalogContext';
import type { SubscriptionPlan } from '../../types';

const CURRENT_PLAN_ID = '1';
const RENEWAL_DATE = '15 May 2026';
const TRIAL_END_DATE = '2026-05-08'; // ~8 days from "today" (2026-04-30)

interface PlanLimits {
  bills: number; // -1 = unlimited
  items: number;
  staff: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  '1': { bills: 500, items: 100, staff: 5 },
  '2': { bills: 2000, items: 500, staff: 15 },
  '3': { bills: -1, items: -1, staff: -1 },
};

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const today = new Date().getTime();
  return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
}

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number; // -1 = unlimited
  icon: React.ReactNode;
  hint: string;
}

function UsageMeter({ label, used, limit, icon, hint }: UsageMeterProps) {
  const isUnlimited = limit < 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const danger = !isUnlimited && pct >= 90;
  const warn = !isUnlimited && pct >= 75 && pct < 90;

  const barColor = danger
    ? 'bg-red-500'
    : warn
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            danger
              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
              : warn
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
          }`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-[11px] text-gray-400 truncate">{hint}</p>
          </div>
        </div>
        {danger && <Badge variant="danger">Near limit</Badge>}
        {warn && <Badge variant="warning">High</Badge>}
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
          {used.toLocaleString('en-IN')}
          <span className="text-xs font-medium text-gray-500 ml-1">
            / {isUnlimited ? '∞' : limit.toLocaleString('en-IN')}
          </span>
        </p>
        {!isUnlimited && (
          <span className={`text-xs font-medium tabular-nums ${
            danger ? 'text-red-600 dark:text-red-400' :
            warn ? 'text-amber-600 dark:text-amber-400' :
            'text-gray-500'
          }`}>
            {pct}%
          </span>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isUnlimited ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : barColor}`}
          style={{ width: isUnlimited ? '100%' : `${pct}%` }}
        />
      </div>

      {isUnlimited && (
        <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Unlimited on your plan</p>
      )}
    </div>
  );
}

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

      {/* Plan limits row */}
      {(() => {
        const limits = PLAN_LIMITS[plan.id];
        if (!limits) return null;
        const fmt = (n: number) => n < 0 ? 'Unlimited' : n.toLocaleString('en-IN');
        return (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-2 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bills</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums mt-0.5">{fmt(limits.bills)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-2 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Items</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums mt-0.5">{fmt(limits.items)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 px-2 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Staff</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums mt-0.5">{fmt(limits.staff)}</p>
            </div>
          </div>
        );
      })()}

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
  const { items: catalogItems } = useShopCatalog();
  const [currentPlanId, setCurrentPlanId] = useState(CURRENT_PLAN_ID);
  const [trialDismissed, setTrialDismissed] = useState<boolean>(
    () => localStorage.getItem('shopmanager.trial.dismissed') === 'true'
  );
  const { addToast } = useToast();

  const currentPlan = subscriptionPlans.find(p => p.id === currentPlanId);
  const limits = PLAN_LIMITS[currentPlanId] || PLAN_LIMITS['1'];

  const usage = useMemo(() => ({
    bills: bills.length,
    items: catalogItems.length,
    staff: staffMembers.length,
  }), [catalogItems.length]);

  const trialDaysLeft = useMemo(() => daysUntil(TRIAL_END_DATE), []);
  const isInTrial = trialDaysLeft > 0 && !trialDismissed;

  const handleChoose = (plan: SubscriptionPlan) => {
    setCurrentPlanId(plan.id);
    addToast('success', `Switched to ${plan.name}`, `Your plan has been updated.`);
  };

  const dismissTrial = () => {
    localStorage.setItem('shopmanager.trial.dismissed', 'true');
    setTrialDismissed(true);
  };

  // Find the closest meter to its limit, for "near-limit" alerting
  const meterStatuses = useMemo(() => {
    const list = [
      { key: 'bills',  used: usage.bills, limit: limits.bills },
      { key: 'items',  used: usage.items, limit: limits.items },
      { key: 'staff',  used: usage.staff, limit: limits.staff },
    ];
    const pcts = list
      .filter(m => m.limit > 0)
      .map(m => Math.round((m.used / m.limit) * 100));
    const max = pcts.length > 0 ? Math.max(...pcts) : 0;
    return { max };
  }, [usage, limits]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="mt-1 text-sm text-gray-500">Choose the plan that fits your shop.</p>
      </div>

      {/* Trial countdown banner */}
      {isInTrial && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-500/10 dark:via-gray-900 dark:to-gray-900 p-4 sm:p-5 relative">
          <button
            onClick={dismissTrial}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-5">
            <div className="flex items-start gap-3 pr-8">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trialDaysLeft === 1 ? 'Your free trial ends tomorrow' : `${trialDaysLeft} days left in your free trial`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Trial ends on {formatDate(TRIAL_END_DATE)} · Pick a plan to keep using all features without interruption.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="primary" size="sm" icon={<ArrowRight size={14} />}
                onClick={() => document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                See plans
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current plan card */}
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
                  {meterStatuses.max >= 90 && <Badge variant="danger">Near plan limit</Badge>}
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

      {/* Usage meters */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">This month's usage</h2>
            <p className="text-xs text-gray-500">Counters reset on your renewal date.</p>
          </div>
          {meterStatuses.max >= 75 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Approaching plan limits — consider upgrading
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UsageMeter
            label="Bills"
            used={usage.bills}
            limit={limits.bills}
            icon={<ReceiptIcon size={16} />}
            hint="Generated this billing cycle"
          />
          <UsageMeter
            label="Inventory items"
            used={usage.items}
            limit={limits.items}
            icon={<Package size={16} />}
            hint="Stocked SKUs in your shop"
          />
          <UsageMeter
            label="Staff seats"
            used={usage.staff}
            limit={limits.staff}
            icon={<Users size={16} />}
            hint="Active members + invites"
          />
        </div>
      </div>

      {/* Plans grid */}
      <div id="plans-grid" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
