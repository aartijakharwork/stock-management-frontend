import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Keyboard } from 'lucide-react';

interface Shortcut { keys: string[]; description: string; group: string; }

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open command palette / global search', group: 'Navigation' },
  { keys: ['/'],       description: 'Focus search', group: 'Navigation' },
  { keys: ['G', 'D'],  description: 'Go to Dashboard', group: 'Navigation' },
  { keys: ['G', 'B'],  description: 'Go to Billing / POS', group: 'Navigation' },
  { keys: ['G', 'C'],  description: 'Go to Customers', group: 'Navigation' },
  { keys: ['G', 'I'],  description: 'Go to Inventory', group: 'Navigation' },
  { keys: ['G', 'R'],  description: 'Go to Reports', group: 'Navigation' },
  { keys: ['?'],       description: 'Show this shortcuts overlay', group: 'Help' },
  { keys: ['Esc'],     description: 'Close any open dialog', group: 'Help' },
  { keys: ['Enter'],   description: 'Confirm primary action', group: 'POS' },
  { keys: ['+'],       description: 'Increase quantity in cart', group: 'POS' },
  { keys: ['−'],       description: 'Decrease quantity in cart', group: 'POS' },
];

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const grouped = Array.from(new Set(SHORTCUTS.map(s => s.group)));

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Keyboard size={16} />
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border border-gray-200 dark:border-gray-700">?</kbd> any time to show this list.</span>
        </div>
        {grouped.map(g => (
          <div key={g}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">{g}</p>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {SHORTCUTS.filter(s => s.group === g).map(s => (
                <li key={s.description} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.description}</span>
                  <span className="flex gap-1">
                    {s.keys.map(k => (
                      <kbd key={k} className="px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 min-w-[22px] text-center">{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
