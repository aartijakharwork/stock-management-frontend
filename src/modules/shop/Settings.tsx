import { useState } from 'react';
import {
  Save, Download, HardDrive, KeyRound, LogOut, Store, ShieldCheck, Eye, EyeOff,
  Wallet, Plus, IndianRupee, FileText, Bell, Plug, Settings as Cog, AlertTriangle,
  Image as ImageIcon, Trash2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { Dropdown } from '../../components/ui/Dropdown';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { useShopProfile } from '../../hooks/useShopProfile';
import { useNavigate } from 'react-router-dom';

type Tab = 'profile' | 'template' | 'tax' | 'numbering' | 'notifications' | 'integrations' | 'backup' | 'danger';

const TABS: { id: Tab; label: string; icon: typeof Store }[] = [
  { id: 'profile', label: 'Shop profile', icon: Store },
  { id: 'template', label: 'Invoice template', icon: FileText },
  { id: 'tax', label: 'Tax setup', icon: IndianRupee },
  { id: 'numbering', label: 'Numbering', icon: Cog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'backup', label: 'Backup & data', icon: HardDrive },
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
];

export function ShopSettings() {
  const [tab, setTab] = useState<Tab>('profile');
  const { profile, invoice, notif, updateProfile, updateInvoice, updateNotif } = useShopProfile();
  const [profileLocal, setProfileLocal] = useState(profile);
  const [invoiceLocal, setInvoiceLocal] = useState(invoice);
  const [securityEnabled, setSecurityEnabled] = useState(() => localStorage.getItem('shopmanager.security.enabled') === 'true');
  const [securityCode, setSecurityCode] = useState(() => localStorage.getItem('shopmanager.security.code') || '');
  const [showCode, setShowCode] = useState(false);
  const { addToast } = useToast();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const canEdit = can('settings', 'edit');

  const [walletBalance] = useState(250);
  const [taxConfig, setTaxConfig] = useState({ defaultRate: 18, gstScheme: 'regular' as 'regular' | 'composition' | 'unregistered' });

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

  const handleProfileSave = () => {
    updateProfile(profileLocal);
    addToast('success', 'Shop profile saved');
  };

  const handleInvoiceSave = () => {
    updateInvoice(invoiceLocal);
    addToast('success', 'Invoice template saved');
  };

  const handleLogout = () => { logout(); navigate('/auth/login'); };

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setProfileLocal(p => ({ ...p, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your shop's branding, invoices, taxes and integrations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 sticky top-16 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop profile</h2>
              <p className="text-xs text-gray-500">This info appears on bills, receipts, and the customer-facing portal.</p>
            </div>
          </div>

          {/* Logo */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shop logo</label>
            {profileLocal.logoUrl ? (
              <div className="flex items-center gap-4">
                <img src={profileLocal.logoUrl} alt="Logo" className="w-20 h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setProfileLocal(p => ({ ...p, logoUrl: undefined }))}>Remove</Button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 text-sm">
                <ImageIcon size={16} className="text-gray-400" />
                <span className="text-gray-500">Upload logo (square, 256×256+)</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          <div className="space-y-4">
            <Input label="Shop name *" value={profileLocal.name} onChange={e => setProfileLocal(p => ({ ...p, name: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <textarea
                rows={3}
                value={profileLocal.address}
                onChange={e => setProfileLocal(p => ({ ...p, address: e.target.value }))}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Phone *" value={profileLocal.phone} onChange={e => setProfileLocal(p => ({ ...p, phone: e.target.value }))} />
              <Input label="Email" type="email" value={profileLocal.email} onChange={e => setProfileLocal(p => ({ ...p, email: e.target.value }))} />
            </div>
            <Input label="GSTIN" value={profileLocal.gstin} onChange={e => setProfileLocal(p => ({ ...p, gstin: e.target.value }))} placeholder="07AABCU9603R1ZM" />
          </div>
          <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleProfileSave}>Save changes</Button>}
          </div>
        </Card>
      )}

      {/* Template tab */}
      {tab === 'template' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Invoice template</h2>
          <p className="text-xs text-gray-500 mb-5">Customize what appears on the printed bill.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dropdown
                label="Receipt size"
                options={[
                  { label: '80mm thermal (most printers)', value: '80mm' },
                  { label: '58mm thermal (compact)', value: '58mm' },
                  { label: 'A4 — full page', value: 'a4' },
                ]}
                value={invoiceLocal.thermalSize}
                onChange={e => setInvoiceLocal(t => ({ ...t, thermalSize: e.target.value as 'a4' | '80mm' | '58mm' }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Footer text</label>
              <textarea
                rows={2}
                value={invoiceLocal.footerText}
                onChange={e => setInvoiceLocal(t => ({ ...t, footerText: e.target.value }))}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>
            <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Show GSTIN</p>
                <p className="text-xs text-gray-500">Print your registration number on every bill</p>
              </div>
              <Toggle checked={invoiceLocal.showGstin} onChange={v => setInvoiceLocal(t => ({ ...t, showGstin: v }))} />
            </label>
            <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Show signature line</p>
                <p className="text-xs text-gray-500">Reserve space for shopkeeper signature at the bottom</p>
              </div>
              <Toggle checked={invoiceLocal.showSignature} onChange={v => setInvoiceLocal(t => ({ ...t, showSignature: v }))} />
            </label>
          </div>
          <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleInvoiceSave}>Save template</Button>}
          </div>
        </Card>
      )}

      {/* Tax setup tab */}
      {tab === 'tax' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Tax setup</h2>
          <p className="text-xs text-gray-500 mb-5">Default GST rates and registration scheme.</p>
          <div className="space-y-4">
            <Dropdown
              label="GST registration scheme"
              options={[
                { label: 'Regular (full GST)', value: 'regular' },
                { label: 'Composition (turnover-based)', value: 'composition' },
                { label: 'Unregistered', value: 'unregistered' },
              ]}
              value={taxConfig.gstScheme}
              onChange={e => setTaxConfig(c => ({ ...c, gstScheme: e.target.value as 'regular' | 'composition' | 'unregistered' }))}
            />
            <Input label="Default tax rate (%)" type="number" value={taxConfig.defaultRate} onChange={e => setTaxConfig(c => ({ ...c, defaultRate: Number(e.target.value) }))} />
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                💡 Item-level tax rates and HSN codes can be set in the Inventory module's Advanced fields drawer.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={() => addToast('success', 'Tax settings saved')}>Save</Button>
          </div>
        </Card>
      )}

      {/* Numbering tab */}
      {tab === 'numbering' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Invoice numbering</h2>
          <p className="text-xs text-gray-500 mb-5">Customize how bill numbers are generated.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prefix" value={invoiceLocal.prefix} onChange={e => setInvoiceLocal(t => ({ ...t, prefix: e.target.value }))} placeholder="INV" />
              <Input label="Start from" type="number" value={invoiceLocal.startNumber} onChange={e => setInvoiceLocal(t => ({ ...t, startNumber: Number(e.target.value) }))} />
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Preview</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">
                {invoiceLocal.prefix}-2026-04-{String(invoiceLocal.startNumber).padStart(4, '0')}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleInvoiceSave}>Save numbering</Button>}
          </div>
        </Card>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <>
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
            <p className="text-xs text-gray-500 mb-5">Choose what alerts you want to receive.</p>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                { key: 'whatsappReminders' as const, label: 'WhatsApp udhaar reminders', helper: 'Auto-send reminders for overdue customer payments.' },
                { key: 'smsReminders' as const, label: 'SMS reminders', helper: 'Fallback SMS when WhatsApp unavailable.' },
                { key: 'lowStockAlerts' as const, label: 'Low-stock alerts', helper: 'Get warned when items drop below reorder level.' },
                { key: 'dailySummary' as const, label: 'Daily summary', helper: 'End-of-day total sales, expenses, dues.' },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.helper}</p>
                  </div>
                  <Toggle checked={notif[item.key]} onChange={v => updateNotif({ [item.key]: v })} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Message wallet</h2>
                  <p className="text-xs text-gray-500">Balance for SMS / WhatsApp notifications.</p>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Current balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">{formatCurrency(walletBalance)}</p>
                </div>
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => addToast('info', 'Recharge flow coming soon')}>Recharge</Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Integrations tab */}
      {tab === 'integrations' && (
        <div className="space-y-4">
          {[
            { name: 'WhatsApp Business', desc: 'Send invoices and payment reminders directly via WhatsApp.', status: 'connected' as const },
            { name: 'Tally / Marg ERP', desc: 'Two-way sync with Tally and Marg accounting software.', status: 'available' as const },
            { name: 'Razorpay / Paytm UPI', desc: 'Accept UPI payments with QR display on POS.', status: 'available' as const },
            { name: 'Google Drive backup', desc: 'Daily automated backup of all bills and customer data.', status: 'available' as const },
            { name: 'GST e-invoice portal', desc: 'Auto-generate IRN for B2B invoices > ₹5cr turnover.', status: 'available' as const },
          ].map(i => (
            <Card key={i.name}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                    <Plug size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{i.name}</p>
                    <p className="text-xs text-gray-500">{i.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {i.status === 'connected'
                    ? <Badge variant="success">Connected</Badge>
                    : <Badge variant="info">Available</Badge>
                  }
                  <Button variant="secondary" size="sm" onClick={() => addToast('info', `${i.name} setup`)}>{i.status === 'connected' ? 'Manage' : 'Connect'}</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Backup tab */}
      {tab === 'backup' && (
        <>
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security code</h2>
                  <p className="text-xs text-gray-500">Required before clearing customer udhaar.</p>
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
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleSecuritySave}>Update code</Button>}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Backup & export</h2>
            <p className="text-xs text-gray-500 mt-0.5">Download a snapshot of all your shop data.</p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="secondary" icon={<Download size={14} />} onClick={() => addToast('info', 'Export started')}>Export bills (CSV)</Button>
              <Button variant="secondary" icon={<HardDrive size={14} />} onClick={() => addToast('success', 'Backup created — 12.4 MB')}>Backup full data</Button>
            </div>
            <p className="mt-4 text-[11px] text-gray-500">Last backup: yesterday at 11:47 PM · Auto-backup is OFF.</p>
          </Card>
        </>
      )}

      {/* Danger zone tab */}
      {tab === 'danger' && (
        <>
          <Card className="border-amber-200 dark:border-amber-500/30">
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

          <Card className="border-red-200 dark:border-red-500/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
                <p className="text-xs text-gray-500">Irreversible actions. Triple-check before proceeding.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reset all transactional data</p>
                  <p className="text-xs text-gray-500">Wipes bills, expenses, ledger. Inventory & customers stay.</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => confirm('Wipe all transactional data?') && addToast('warning', 'Reset would happen here')}>Reset</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Close shop account</p>
                  <p className="text-xs text-gray-500">Permanently delete shop and all data. Cannot be undone.</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => confirm('Permanently delete shop?') && addToast('error', 'Account closure would happen here')}>Close account</Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
