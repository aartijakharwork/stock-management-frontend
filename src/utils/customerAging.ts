import type { Bill, Customer } from '../types';

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export interface AgingInfo {
  bucket: AgingBucket;
  oldestDays: number;
  oldestDate?: string;
}

/**
 * Compute the aging bucket for a customer based on the oldest unpaid udhaar bill.
 * Returns null if there's no pending amount.
 */
export function customerAging(customer: Customer, bills: Bill[]): AgingInfo | null {
  if (customer.pendingAmount <= 0) return null;
  const unpaid = bills.filter(b => b.customerId === customer.id && b.isUdhaar && !b.paid);
  if (unpaid.length === 0) {
    // pendingAmount > 0 but no specific unpaid bill — fall back to a sensible default
    return { bucket: '0-30', oldestDays: 0 };
  }
  const oldest = unpaid.reduce((a, b) => a.date < b.date ? a : b);
  const oldestDate = oldest.date;
  const days = Math.max(0, Math.floor((Date.now() - new Date(oldestDate).getTime()) / 86_400_000));
  let bucket: AgingBucket = '0-30';
  if (days > 90) bucket = '90+';
  else if (days > 60) bucket = '61-90';
  else if (days > 30) bucket = '31-60';
  return { bucket, oldestDays: days, oldestDate };
}

export const AGING_TONES: Record<AgingBucket, { bg: string; text: string; border: string; label: string }> = {
  '0-30':  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', label: '0–30d' },
  '31-60': { bg: 'bg-yellow-50 dark:bg-yellow-500/10',   text: 'text-yellow-700 dark:text-yellow-400',   border: 'border-yellow-200 dark:border-yellow-500/30',   label: '31–60d' },
  '61-90': { bg: 'bg-orange-50 dark:bg-orange-500/10',   text: 'text-orange-700 dark:text-orange-400',   border: 'border-orange-200 dark:border-orange-500/30',   label: '61–90d' },
  '90+':   { bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-500/30',         label: '90+ d' },
};

export type CustomerHealth = 'good' | 'watch' | 'risk';

/**
 * Customer health classification:
 * - risk: aging > 60 days OR utilization > 100%
 * - watch: aging 31-60 OR utilization > 80%
 * - good: everyone else
 */
export function customerHealth(customer: Customer, aging: AgingInfo | null): CustomerHealth {
  if (customer.creditLimit && customer.creditLimit > 0) {
    const util = customer.pendingAmount / customer.creditLimit;
    if (util > 1) return 'risk';
    if (util > 0.8) return 'watch';
  }
  if (aging) {
    if (aging.bucket === '90+' || aging.bucket === '61-90') return 'risk';
    if (aging.bucket === '31-60') return 'watch';
  }
  return 'good';
}

export const HEALTH_TONES: Record<CustomerHealth, { bg: string; text: string; label: string; emoji: string }> = {
  good:  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Good',    emoji: '●' },
  watch: { bg: 'bg-amber-100 dark:bg-amber-500/20',     text: 'text-amber-700 dark:text-amber-400',     label: 'Watch',   emoji: '●' },
  risk:  { bg: 'bg-red-100 dark:bg-red-500/20',         text: 'text-red-700 dark:text-red-400',         label: 'At risk', emoji: '●' },
};
