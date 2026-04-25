import { useState } from 'react';
import { Save, Download, HardDrive, AlertTriangle, KeyRound, LogOut, Store } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Toggle } from '../components/ui/Toggle';
import { Modal } from '../components/ui/Modal';

interface Preferences {
  billPrint: boolean;
  lowStockAlerts: boolean;
  defaultUdhaar: boolean;
  dailySummary: boolean;
}

const preferenceMeta: Record<keyof Preferences, { label: string; helper: string }> = {
  billPrint: {
    label: 'Enable bill printing',
    helper: 'Print bills directly after creating them.',
  },
  lowStockAlerts: {
    label: 'Show low-stock alerts on dashboard',
    helper: 'Get warned when items are running out.',
  },
  defaultUdhaar: {
    label: 'Default to Udhaar mode for known customers',
    helper: 'New bills for regulars start as credit sales.',
  },
  dailySummary: {
    label: 'Daily summary at end of day',
    helper: 'See total sales and dues every evening.',
  },
};

export function Settings() {
  const [shop, setShop] = useState({
    name: 'Kumar Auto Parts',
    address: '123, Main Market, Karol Bagh, New Delhi',
    phone: '9876543200',
    gst: '07AABCU9603R1ZM',
  });
  const [prefs, setPrefs] = useState<Preferences>({
    billPrint: true,
    lowStockAlerts: true,
    defaultUdhaar: false,
    dailySummary: true,
  });
  const [shopSaved, setShopSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const handleShopSave = () => {
    setShopSaved(true);
    setTimeout(() => setShopSaved(false), 1800);
  };

  const handleReset = () => {
    setResetOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Manage your shop preferences</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-500/20 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
            <Store size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Details</h2>
            <p className="mt-0.5 text-xs text-gray-500">This appears on bills and receipts.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            label="Shop name"
            value={shop.name}
            onChange={e => setShop({ ...shop, name: e.target.value })}
            placeholder="Your shop name"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="shop-address" className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">
              Address
            </label>
            <textarea
              id="shop-address"
              rows={3}
              value={shop.address}
              onChange={e => setShop({ ...shop, address: e.target.value })}
              placeholder="Full shop address"
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500 dark:focus:border-cyan-400/60 transition-colors outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={shop.phone}
              onChange={e => setShop({ ...shop, phone: e.target.value })}
              placeholder="10-digit number"
              inputMode="tel"
            />
            <Input
              label="GST (optional)"
              value={shop.gst}
              onChange={e => setShop({ ...shop, gst: e.target.value })}
              placeholder="GST number if you have one"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/5">
          {shopSaved && <span className="text-xs text-emerald-700 dark:text-emerald-300">Saved</span>}
          <Button variant="primary" icon={<Save size={14} />} size="sm" onClick={handleShopSave}>
            Save changes
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
        <p className="mt-0.5 text-xs text-gray-500">Turn things on or off to suit your shop.</p>

        <div className="mt-5 divide-y divide-gray-200 dark:divide-white/5">
          {(Object.entries(preferenceMeta) as [keyof Preferences, { label: string; helper: string }][]).map(
            ([key, meta]) => (
              <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{meta.helper}</p>
                </div>
                <Toggle
                  checked={prefs[key]}
                  onChange={v => setPrefs(prev => ({ ...prev, [key]: v }))}
                />
              </div>
            )
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data</h2>
        <p className="mt-0.5 text-xs text-gray-500">Backup, export, or start fresh.</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="secondary" icon={<Download size={14} />}>
            Export bills (CSV)
          </Button>
          <Button variant="secondary" icon={<HardDrive size={14} />}>
            Backup data
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.04] p-3">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle size={16} className="text-red-700 dark:text-red-300 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">Reset all data</p>
              <p className="text-xs text-gray-500">This deletes bills, customers, and stock. Cannot be undone.</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            Reset
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
        <p className="mt-0.5 text-xs text-gray-500">Your sign-in details.</p>

        <div className="mt-5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Shop owner</p>
          <p className="text-sm text-gray-900 dark:text-white">Kumar Singh</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">pi3@kryptsec.com</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row pt-4 border-t border-gray-200 dark:border-white/5">
          <Button variant="secondary" icon={<KeyRound size={14} />} size="sm">
            Change password
          </Button>
          <Button variant="ghost" icon={<LogOut size={14} />} size="sm">
            Sign out
          </Button>
        </div>
      </Card>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This will permanently delete every bill, customer, and stock record. There is no way to undo this.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Yes, reset everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
