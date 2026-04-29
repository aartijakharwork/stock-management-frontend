import { useState } from 'react';
import { Save, Download, HardDrive, KeyRound, LogOut, Store, ShieldCheck, Eye, EyeOff, Wallet, Plus, IndianRupee } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { formatCurrency } from '../../utils/formatters';
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
  const [securityEnabled, setSecurityEnabled] = useState(() => localStorage.getItem('shopmanager.security.enabled') === 'true');
  const [securityCode, setSecurityCode] = useState(() => localStorage.getItem('shopmanager.security.code') || '');
  const [showCode, setShowCode] = useState(false);
  const { addToast } = useToast();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const canEdit = can('settings', 'edit');

  const [walletBalance] = useState(250);
  const handleShopSave = () => addToast('success', 'Shop details saved');
  const handleSecurityToggle = (enabled: boolean) => {
    setSecurityEnabled(enabled);
    localStorage.setItem('shopmanager.security.enabled', String(enabled));
    if (!enabled) {
      localStorage.removeItem('shopmanager.security.code');
      setSecurityCode('');
    }
    addToast('success', enabled ? 'Security code enabled' : 'Security code disabled');
  };
  const handleSecuritySave = () => {
    if (!securityCode.trim()) { addToast('error', 'Enter a security code'); return; }
    localStorage.setItem('shopmanager.security.code', securityCode);
    addToast('success', 'Security code updated');
  };
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Code</h2>
              <p className="text-xs text-gray-500">Require a code before clearing customer dues.</p>
            </div>
          </div>
          <Toggle checked={securityEnabled} onChange={handleSecurityToggle} />
        </div>
        {securityEnabled && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 relative">
                <Input
                  label="Security code"
                  type={showCode ? 'text' : 'password'}
                  value={securityCode}
                  onChange={e => setSecurityCode(e.target.value)}
                  placeholder="Enter 4-6 digit code"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleSecuritySave}>Update code</Button>}
            </div>
            <p className="mt-3 text-xs text-gray-500">Staff will need to enter this code before clearing udhaar payments. Keep it private.</p>
          </div>
        )}
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Message Wallet</h2>
              <p className="text-xs text-gray-500">Balance used for sending SMS and WhatsApp notifications.</p>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3">
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">{formatCurrency(walletBalance)}</p>
              </div>
              <div className="hidden sm:block text-xs text-gray-500 max-w-[200px]">
                <p>Used for bill alerts, payment reminders, and low-stock notifications.</p>
              </div>
            </div>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => addToast('info', 'Recharge flow coming soon')}>Recharge wallet</Button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <IndianRupee size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Per SMS</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">₹0.50</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <IndianRupee size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Per WhatsApp</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">₹0.75</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <IndianRupee size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Messages left</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">~500 SMS</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data</h2>
        <p className="text-xs text-gray-500 mt-0.5">Export and backup your data.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="secondary" icon={<Download size={14} />} onClick={() => addToast('info', 'Export started')}>Export bills (CSV)</Button>
          <Button variant="secondary" icon={<HardDrive size={14} />} onClick={() => addToast('info', 'Backup created')}>Backup data</Button>
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
    </div>
  );
}
