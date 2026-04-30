import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

const CURRENT_VERSION = '2.0';
const KEY = 'shopmanager.whatsnew.seen';

interface FeatureRow {
  emoji: string;
  title: string;
  description: string;
}

const HIGHLIGHTS: FeatureRow[] = [
  { emoji: '📦', title: 'Inventory expansion', description: 'Cost prices with auto-margin, SKU/barcode, HSN codes, reorder levels and supplier links.' },
  { emoji: '💰', title: 'Real P&L view',       description: 'Revenue − COGS − Expenses with month-by-month GST summary in Reports.' },
  { emoji: '👥', title: 'Customer ledger',     description: 'Khata-style chronological view with running balance and aging buckets.' },
  { emoji: '🔄', title: 'Returns + split tender', description: 'Process refunds via credit notes and accept Cash + UPI + Udhaar mixed payments.' },
  { emoji: '🏭', title: 'Suppliers + Expenses', description: 'Manage vendors, payables, purchase orders and full expense tracking.' },
  { emoji: '⌘', title: 'Cmd+K command palette', description: 'Jump to anything — customer, item, bill, page — in one keystroke.' },
];

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(KEY);
    if (seen !== CURRENT_VERSION) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(KEY, CURRENT_VERSION);
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={dismiss} title="What's new" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-500/10 dark:to-blue-500/10 border border-emerald-200 dark:border-emerald-500/30">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">ShopManager v{CURRENT_VERSION}</p>
            <p className="text-xs text-gray-500">Phase 2 + Phase 3 just shipped — your shop is now fully equipped.</p>
          </div>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {HIGHLIGHTS.map(f => (
            <li key={f.title} className="py-3 flex items-start gap-3">
              <span className="text-2xl" aria-hidden>{f.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-2">
          <Button variant="primary" icon={<ArrowRight size={14} />} onClick={dismiss}>Let's go</Button>
        </div>
      </div>
    </Modal>
  );
}
