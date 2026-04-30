import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface JargonHintProps {
  term: string;
  description?: string;
  className?: string;
}

const GLOSSARY: Record<string, { title: string; description: string }> = {
  udhaar: {
    title: 'Udhaar (Credit)',
    description: 'Money the customer owes you. Common in Indian shops — sale is given on trust and paid later. Tracked in the customer ledger.',
  },
  hsn: {
    title: 'HSN code',
    description: 'Harmonized System of Nomenclature — a 4–8 digit code that identifies the product type for GST. Required on B2B invoices above ₹5 cr turnover.',
  },
  margin: {
    title: 'Margin %',
    description: 'How much you keep after costs. Margin = (Sell − Cost) ÷ Sell × 100. A 30% margin means ₹30 profit per ₹100 sale.',
  },
  cogs: {
    title: 'COGS',
    description: 'Cost of Goods Sold. Total cost price of all items sold in a period. Revenue − COGS = Gross profit.',
  },
  gstin: {
    title: 'GSTIN',
    description: '15-character unique GST registration number for businesses. Required on B2B tax invoices.',
  },
  reorder: {
    title: 'Reorder level',
    description: 'When stock drops to this number, you should reorder from your supplier. Set per item based on how fast it sells.',
  },
  aging: {
    title: 'Aging buckets',
    description: 'How long the udhaar is overdue, grouped as 0–30, 31–60, 61–90, 90+ days. Older debt is harder to recover.',
  },
  splittender: {
    title: 'Split tender',
    description: 'When a single bill is paid using multiple methods — e.g. ₹500 cash + ₹1,000 UPI + ₹200 udhaar.',
  },
  roundoff: {
    title: 'Round-off',
    description: 'Tiny adjustment to make the bill total a clean number. ₹1,234.78 rounds to ₹1,235 with +0.22 round-off.',
  },
};

export function JargonHint({ term, description, className = '' }: JargonHintProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const info = GLOSSARY[term.toLowerCase()] ?? { title: term, description: description ?? '' };

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors align-text-bottom"
        aria-label={`Help: ${info.title}`}
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 mt-1.5 w-64 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-xs leading-relaxed shadow-lg border border-gray-800">
          <span className="block font-semibold text-emerald-300 mb-0.5">{info.title}</span>
          <span className="block text-gray-200">{info.description}</span>
        </span>
      )}
    </span>
  );
}
