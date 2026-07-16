import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const reposition = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const tipW = 256;
    let left = r.left + r.width / 2 - tipW / 2;
    const pad = 8;
    if (left < pad) left = pad;
    if (left + tipW > window.innerWidth - pad) left = window.innerWidth - pad - tipW;
    setPos({ top: r.top - 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    const onClickOutside = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        tipRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, reposition]);

  const info = GLOSSARY[term.toLowerCase()] ?? { title: term, description: description ?? '' };

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors align-text-bottom"
        aria-label={`Help: ${info.title}`}
      >
        <HelpCircle size={13} />
      </button>
      {open && createPortal(
        <span
          ref={tipRef}
          className="fixed z-[9999] w-64 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-xs leading-relaxed shadow-lg border border-gray-800 animate-tooltip-up"
          style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}
        >
          <span className="block font-semibold text-emerald-300 mb-0.5">{info.title}</span>
          <span className="block text-gray-200">{info.description}</span>
        </span>,
        document.body,
      )}
    </span>
  );
}
