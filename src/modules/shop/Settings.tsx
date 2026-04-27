import { useState } from 'react';
import { Save, Download, HardDrive, AlertTriangle, KeyRound, LogOut, Store } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { useNavigate } from 'react-router-dom';

interface Preferences {
  billPrint: boolean;
  lowStockAlerts: boolean;
  defaultUdhaar: boolean;
  dailySummary: boolean;
}

const preferenceMeta: Record<keyof Preferences, { label: string; helper: string }> = {
  billPrint: { label: 'Enable bill printing', helper: 'Print bills directly after creating them.' },
  lowStockAlerts: { label: 'Low-stock alerts on dashboard', helper: 'Get warned when items are running out.' },
  defaultUdhaar: { label: 'Default Udhaar for known customers', helper: 'New bills for regulars start as credit sales.' },
  dailySummary: { label: 'Daily summary at end of day', helper: 'See total sales and dues every evening.' },
};

export function ShopSettings() {
  const [shop, setShop] = useState({ name: 'Kumar Auto Parts', address: '123, Main Market, Karol Bagh, New Delhi', phone: '9876543200', gst: '07AABCU9603R1ZM' });
  const [prefs, setPrefs] = useState<Preferences>({ billPrint: true, lowStockAlerts: true, defaultUdhaar: false, dailySummary: true });
  const [resetOpen, setResetOpen] = useState(false);
  const { addToast } = useToast();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const canEdit = can('settings', 'edit');

  const handleShopSave = () => addToast('success', 'Shop details saved');
  const handleReset = () => { setResetOpen(false); addToast('warning', 'Data reset', 'All data has been cleared.'); };
  const handleLogout = () => { logout(); navigate('/auth/login'); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your shop preferences.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Store size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Details</h2>
            <p className="text-xs text-gray-500">This appears on bills and receipts.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input label="Shop name" value={shop.name} onChange={e => setShop({ ...shop, name: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <textarea rows={3} value={shop.address} onChange={e => setShop({ ...shop, address: e.target.value })}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={shop.phone} onChange={e => setShop({ ...shop, phone: e.target.value })} inputMode="tel" />
            <Input label="GST (optional)" value={shop.gst} onChange={e => setShop({ ...shop, gst: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
          {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleShopSave}>Save changes</Button>}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
        <p className="text-xs text-gray-500 mt-0.5">Turn things on or off to suit your shop.</p>
        <div className="mt-5 divide-y divide-gray-200 dark:divide-gray-800">
          {(Object.entries(preferenceMeta) as [keyof Preferences, { label: string; helper: string }][]).map(([key, meta]) => (
            <div key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div><p className="text-sm text-gray-900 dark:text-white">{meta.label}</p><p className="text-xs text-gray-500 mt-0.5">{meta.helper}</p></div>
              <Toggle checked={prefs[key]} onChange={v => setPrefs(prev => ({ ...prev, [key]: v }))} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data</h2>
        <p className="text-xs text-gray-500 mt-0.5">Backup, export, or start fresh.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="secondary" icon={<Download size={14} />} onClick={() => addToast('info', 'Export started')}>Export bills (CSV)</Button>
          <Button variant="secondary" icon={<HardDrive size={14} />} onClick={() => addToast('info', 'Backup created')}>Backup data</Button>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div><p className="text-sm text-gray-900 dark:text-white">Reset all data</p><p className="text-xs text-gray-500">Deletes bills, customers, and stock. Cannot be undone.</p></div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>Reset</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
        <div className="mt-4">
          <p className="text-xs text-gray-500">Shop owner</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
          <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
        </div>
        <div className="mt-5 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="secondary" icon={<KeyRound size={14} />} size="sm" onClick={() => addToast('info', 'Password change UI')}>Change password</Button>
          <Button variant="ghost" icon={<LogOut size={14} />} size="sm" onClick={handleLogout}>Sign out</Button>
        </div>
      </Card>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">This will permanently delete every bill, customer, and stock record. There is no way to undo this.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReset}>Yes, reset everything</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
