import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Save, Download, HardDrive, KeyRound, LogOut, Store, ShieldCheck, Eye, EyeOff,
  Wallet, Plus, IndianRupee, FileText, Bell, Plug, Settings as Cog, AlertTriangle,
  Image as ImageIcon, Trash2, Printer, Eye as EyeIcon, Tags, Monitor,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { Dropdown } from '../../components/ui/Dropdown';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { UnsavedChangesGuard } from '../../components/ui/UnsavedChangesGuard';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { useShopProfile } from '../../hooks/useShopProfile';
import { isSoundEnabled, setSoundEnabled, playSuccess } from '../../utils/feedback';
import { MVP_MODE, MVP_VISIBLE_SETTINGS_TABS } from '../../config/mvp';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SettingsCategoriesPanel } from './Categories';
import { useCostPriceSecurity } from '../../hooks/useCostPriceSecurity';

type Tab = 'profile' | 'template' | 'categories' | 'tax' | 'numbering' | 'notifications' | 'integrations' | 'backup' | 'danger';

const ALL_TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Shop profile', icon: Store },
  { id: 'template', label: 'Invoice template', icon: FileText },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'tax', label: 'Tax setup', icon: IndianRupee },
  { id: 'numbering', label: 'Numbering', icon: Cog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'backup', label: 'Backup & data', icon: HardDrive },
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
];

const SETTINGS_PHASE1_IDS = new Set<string>(MVP_VISIBLE_SETTINGS_TABS as unknown as string[]);

const TABS = MVP_MODE
  ? ALL_TABS.filter(t => SETTINGS_PHASE1_IDS.has(t.id))
  : ALL_TABS;

export function ShopSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo((): Tab => {
    const q = searchParams.get('tab') as Tab | null;
    if (q && TABS.some(t => t.id === q)) return q;
    return 'profile';
  }, [searchParams]);
  const { profile, invoice, notif, updateProfile, updateInvoice, updateNotif } = useShopProfile();
  const [profileLocal, setProfileLocal] = useState(profile);
  const [invoiceLocal, setInvoiceLocal] = useState(invoice);
  const [securityEnabled, setSecurityEnabled] = useState(() => localStorage.getItem('shopmanager.security.enabled') === 'true');
  const [securityCode, setSecurityCode] = useState(() => localStorage.getItem('shopmanager.security.code') || '');
  const [showCode, setShowCode] = useState(false);
  const cpSecurity = useCostPriceSecurity();
  const [cpPin, setCpPin] = useState(cpSecurity.pin);
  const [cpCodeMap, setCpCodeMap] = useState(cpSecurity.codeMap);
  const [showCpPin, setShowCpPin] = useState(false);
  const [cpTestInput, setCpTestInput] = useState('');
  const { addToast } = useToast();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const canEdit = can('settings', 'edit');

  /** Drop invalid ?tab= values (e.g. hidden in MVP) so URL and UI stay aligned. */
  useEffect(() => {
    const q = searchParams.get('tab');
    if (q && !TABS.some(t => t.id === q)) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [walletBalance] = useState(250);
  const [taxConfig, setTaxConfig] = useState({ defaultRate: 18, gstScheme: 'regular' as 'regular' | 'composition' | 'unregistered' });
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(profileLocal) !== JSON.stringify(profile)
      || JSON.stringify(invoiceLocal) !== JSON.stringify(invoice);
  }, [profileLocal, profile, invoiceLocal, invoice]);

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

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const handleProfileSave = () => {
    const errs: Record<string, string> = {};
    if (!profileLocal.name.trim()) errs.name = 'Shop name is required';
    if (!profileLocal.phone.trim()) errs.phone = 'Phone number is required';
    if (profileLocal.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileLocal.email)) errs.email = 'Enter a valid email';
    if (profileLocal.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(profileLocal.gstin)) errs.gstin = 'Enter a valid 15-digit GSTIN';
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) { addToast('error', 'Fix errors before saving'); return; }
    updateProfile(profileLocal);
    addToast('success', 'Shop profile saved');
  };

  const handleInvoiceSave = () => {
    updateInvoice(invoiceLocal);
    addToast('success', 'Invoice template saved');
  };

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSubmitting, setCpSubmitting] = useState(false);

  interface SessionInfo { id: string; createdAt: string; expiresAt: string; current: boolean; }
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const loadSessions = useCallback(async () => {
    const { api: apiCall } = await import('../../api/client');
    const res = await apiCall('/auth/sessions');
    if (res.ok) setSessions(await res.json());
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleChangePassword = async () => {
    if (!cpCurrent) { setCpError('Current password is required'); return; }
    if (cpNew.length < 6) { setCpError('New password must be at least 6 characters'); return; }
    if (cpNew !== cpConfirm) { setCpError('Passwords do not match'); return; }
    setCpError('');
    setCpSubmitting(true);
    const { api: apiCall } = await import('../../api/client');
    const res = await apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
    });
    setCpSubmitting(false);
    if (res.ok) {
      addToast('success', 'Password updated');
      setShowChangePassword(false);
      setCpCurrent(''); setCpNew(''); setCpConfirm('');
    } else {
      const data = await res.json();
      setCpError(data.error || 'Failed to change password');
    }
  };

  const tabStripItems = useMemo(
    () => TABS.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon size={14} /> })),
    [],
  );

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
      <UnsavedChangesGuard hasChanges={hasUnsavedChanges} />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          {MVP_MODE
            ? 'Your shop name on bills, how receipts look, and backup — the essentials.'
            : 'Manage your shop\'s branding, invoices, taxes and integrations.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm py-1">
        <Tabs
          tabs={tabStripItems}
          activeTab={tab}
          onChange={(id) => {
            const next = id as Tab;
            if (next === 'profile') setSearchParams({}, { replace: true });
            else setSearchParams({ tab: next }, { replace: true });
          }}
          size="sm"
        />
      </div>

      {/* Profile tab */}
      <TabPanel id="profile" activeTab={tab}>
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
            <Input label="Shop name *" value={profileLocal.name} error={profileErrors.name} onChange={e => { setProfileLocal(p => ({ ...p, name: e.target.value })); setProfileErrors(e2 => { const n = { ...e2 }; delete n.name; return n; }); }} />
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
              <Input label="Phone *" value={profileLocal.phone} error={profileErrors.phone} onChange={e => { setProfileLocal(p => ({ ...p, phone: e.target.value })); setProfileErrors(e2 => { const n = { ...e2 }; delete n.phone; return n; }); }} />
              <Input label="Email" type="email" value={profileLocal.email} error={profileErrors.email} onChange={e => { setProfileLocal(p => ({ ...p, email: e.target.value })); setProfileErrors(e2 => { const n = { ...e2 }; delete n.email; return n; }); }} />
            </div>
            <Input label="GSTIN" value={profileLocal.gstin} error={profileErrors.gstin} onChange={e => { setProfileLocal(p => ({ ...p, gstin: e.target.value })); setProfileErrors(e2 => { const n = { ...e2 }; delete n.gstin; return n; }); }} placeholder="07AABCU9603R1ZM" />
          </div>
          <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            {canEdit && <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleProfileSave}>Save changes</Button>}
          </div>
        </Card>
      </TabPanel>

      {/* Template tab */}
      <TabPanel id="template" activeTab={tab}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice template</h2>
              <button onClick={() => document.getElementById('receipt-preview-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="lg:hidden inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <EyeIcon size={12} /> See preview
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-5">Customize what appears on the printed bill. Preview updates live as you edit.</p>
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

          {/* Live receipt preview */}
          <div id="receipt-preview-block">
            <div className="lg:sticky lg:top-32">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Live preview</p>
                </div>
                <button onClick={() => window.print()} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <Printer size={12} /> Test print
                </button>
              </div>
              <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm mx-auto overflow-hidden transition-all duration-200 ${
                invoiceLocal.thermalSize === '58mm' ? 'max-w-[220px]' : invoiceLocal.thermalSize === '80mm' ? 'max-w-[300px]' : 'max-w-full'
              }`}>
                <div className="p-4 text-center border-b border-dashed border-gray-300 dark:border-gray-700">
                  {profileLocal.logoUrl && <img src={profileLocal.logoUrl} alt="" className="w-10 h-10 mx-auto mb-2 rounded object-cover" />}
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{profileLocal.name || 'Shop Name'}</p>
                  {profileLocal.address && <p className="text-[10px] text-gray-500 mt-0.5 whitespace-pre-line">{profileLocal.address}</p>}
                  {profileLocal.phone && <p className="text-[10px] text-gray-500">Ph: {profileLocal.phone}</p>}
                  {profileLocal.email && <p className="text-[10px] text-gray-500">{profileLocal.email}</p>}
                  {invoiceLocal.showGstin && profileLocal.gstin && <p className="text-[10px] font-mono text-gray-400 mt-0.5">GSTIN: {profileLocal.gstin}</p>}
                </div>
                <div className="px-4 py-2 border-b border-dashed border-gray-300 dark:border-gray-700">
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>{invoiceLocal.prefix || 'INV'}-2026-04-{String(invoiceLocal.startNumber || 1).padStart(4, '0')}</span>
                    <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">Customer: Rajesh Patel</p>
                </div>
                <div className="px-4 py-2">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-1 font-medium">Item</th>
                        <th className="text-center py-1 font-medium">Qty</th>
                        <th className="text-right py-1 font-medium">Amt</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                      <tr><td className="py-0.5">Engine Oil 5W-30</td><td className="text-center">2</td><td className="text-right tabular-nums">{formatCurrency(1200)}</td></tr>
                      <tr><td className="py-0.5">Oil Filter</td><td className="text-center">1</td><td className="text-right tabular-nums">{formatCurrency(350)}</td></tr>
                      <tr><td className="py-0.5">Brake Pad Set</td><td className="text-center">1</td><td className="text-right tabular-nums">{formatCurrency(1800)}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 border-t border-dashed border-gray-300 dark:border-gray-700 space-y-0.5">
                  <div className="flex justify-between text-[10px] text-gray-500"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(3350)}</span></div>
                  {invoiceLocal.showGstin && (
                    <>
                      <div className="flex justify-between text-[10px] text-gray-500"><span>CGST (9%)</span><span className="tabular-nums">{formatCurrency(301)}</span></div>
                      <div className="flex justify-between text-[10px] text-gray-500"><span>SGST (9%)</span><span className="tabular-nums">{formatCurrency(301)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700"><span>Total</span><span className="tabular-nums">{formatCurrency(invoiceLocal.showGstin ? 3952 : 3350)}</span></div>
                  <div className="flex justify-between text-[10px] text-gray-500"><span>Paid via</span><span>Cash</span></div>
                </div>
                {(invoiceLocal.footerText || invoiceLocal.showSignature) && (
                  <div className="px-4 py-3 border-t border-dashed border-gray-300 dark:border-gray-700 text-center">
                    {invoiceLocal.footerText && <p className="text-[10px] text-gray-400 italic whitespace-pre-line">{invoiceLocal.footerText}</p>}
                    {invoiceLocal.showSignature && (
                      <div className="mt-4 pt-3">
                        <div className="w-24 mx-auto border-t border-gray-300 dark:border-gray-600" />
                        <p className="text-[9px] text-gray-400 mt-1">Authorized Signature</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Sample data shown · actual bills use live values</p>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel id="categories" activeTab={tab}>
        <SettingsCategoriesPanel />
      </TabPanel>

      {/* Tax setup tab */}
      <TabPanel id="tax" activeTab={tab}>
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
      </TabPanel>

      {/* Numbering tab */}
      <TabPanel id="numbering" activeTab={tab}>
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
      </TabPanel>

      {/* Notifications tab */}
      <TabPanel id="notifications" activeTab={tab}>
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
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Sound on bill confirm</p>
                  <p className="text-xs text-gray-500 mt-0.5">Soft chime + haptic buzz when a bill is generated.</p>
                </div>
                <Toggle checked={soundOn} onChange={v => { setSoundOn(v); setSoundEnabled(v); if (v) playSuccess(); }} />
              </div>
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
      </TabPanel>

      {/* Integrations tab */}
      <TabPanel id="integrations" activeTab={tab}>
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
      </TabPanel>

      {/* Backup tab */}
      <TabPanel id="backup" activeTab={tab}>
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

          {/* Cost price security */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cost Price Protection</h2>
                  <p className="text-xs text-gray-500">Hide cost prices from staff. Only visible after PIN verification.</p>
                </div>
              </div>
              <Toggle checked={cpSecurity.enabled} onChange={v => {
                cpSecurity.setEnabled(v);
                if (!v) cpSecurity.hide();
                addToast('success', v ? 'Cost price protection enabled' : 'Cost price protection disabled');
              }} />
            </div>

            {cpSecurity.enabled && (
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800 space-y-5">
                {/* PIN */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Admin PIN</p>
                  <p className="text-xs text-gray-500 mb-3">Staff will need this PIN to reveal cost prices.</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 relative">
                      <Input
                        label="PIN (4–6 digits)"
                        type={showCpPin ? 'text' : 'password'}
                        value={cpPin}
                        onChange={e => setCpPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="e.g. 1234"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCpPin(!showCpPin)}
                        className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCpPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {canEdit && (
                      <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={() => {
                        if (cpPin.length < 4) { addToast('error', 'PIN must be at least 4 digits'); return; }
                        cpSecurity.setPin(cpPin);
                        addToast('success', 'Cost price PIN saved');
                      }}>Save PIN</Button>
                    )}
                  </div>
                </div>

                {/* Coded input toggle */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Coded Cost Price Input</p>
                      <p className="text-xs text-gray-500 mt-0.5">Enter cost price as alphabetic codes instead of numbers. Only you know the mapping.</p>
                    </div>
                    <Toggle checked={cpSecurity.codedInputEnabled} onChange={v => {
                      cpSecurity.setCodedInput(v);
                      addToast('success', v ? 'Coded input enabled' : 'Coded input disabled');
                    }} />
                  </div>

                  {cpSecurity.codedInputEnabled && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Input
                          label="Code mapping (10 unique letters, one per digit 0-9)"
                          value={cpCodeMap}
                          onChange={e => {
                            const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                            const unique = [...new Set(v.split(''))].join('').slice(0, 10);
                            setCpCodeMap(unique);
                          }}
                          placeholder="e.g. ABCDEFGHIJ"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">Each letter maps to a digit: {cpCodeMap.split('').map((ch, i) => `${ch}=${i}`).join(', ')}</p>
                      </div>
                      {canEdit && (
                        <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={() => {
                          if (cpCodeMap.length < 10) { addToast('error', 'Enter 10 unique letters'); return; }
                          cpSecurity.setCodeMap(cpCodeMap);
                          addToast('success', 'Code mapping saved');
                        }}>Save mapping</Button>
                      )}

                      {/* Live test */}
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">Test your code</p>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              label="Type coded price"
                              value={cpTestInput}
                              onChange={e => setCpTestInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                              placeholder={`e.g. ${cpSecurity.encodePrice(540)}`}
                            />
                          </div>
                          <div className="pb-1">
                            <p className="text-xs text-gray-500">Decodes to</p>
                            <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                              {cpTestInput ? (cpSecurity.decodePrice(cpTestInput) != null ? `₹${cpSecurity.decodePrice(cpTestInput)!.toLocaleString('en-IN')}` : <span className="text-red-500 text-sm">Invalid</span>) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
      </TabPanel>

      {/* Danger zone tab */}
      <TabPanel id="danger" activeTab={tab}>
        <>
          <Card className="border-amber-200 dark:border-amber-500/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
            <div className="mt-4">
              <p className="text-xs text-gray-500">Shop owner</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
            </div>
            <div className="mt-5 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="secondary" icon={<KeyRound size={14} />} size="sm" onClick={() => setShowChangePassword(!showChangePassword)}>
                {showChangePassword ? 'Cancel' : 'Change password'}
              </Button>
              <Button variant="ghost" icon={<LogOut size={14} />} size="sm" onClick={handleLogout}>Sign out</Button>
            </div>
            {showChangePassword && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3 max-w-sm">
                <Input label="Current password" type="password" value={cpCurrent} onChange={e => setCpCurrent(e.target.value)} placeholder="Enter current password" />
                <Input label="New password" type="password" value={cpNew} onChange={e => setCpNew(e.target.value)} placeholder="Min 6 characters" />
                <Input label="Confirm new password" type="password" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} placeholder="Re-enter new password" />
                {cpError && <p className="text-sm text-red-600 dark:text-red-400">{cpError}</p>}
                <Button variant="primary" size="sm" disabled={cpSubmitting} onClick={handleChangePassword}>
                  {cpSubmitting ? 'Saving...' : 'Update password'}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active sessions</h2>
                <p className="text-xs text-gray-500 mt-0.5">Devices where you are currently signed in.</p>
              </div>
              {sessions.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  disabled={revokingOthers}
                  onClick={async () => {
                    setRevokingOthers(true);
                    const { api: apiCall } = await import('../../api/client');
                    const res = await apiCall('/auth/sessions/revoke-others', { method: 'POST' });
                    setRevokingOthers(false);
                    if (res.ok) {
                      const data = await res.json();
                      addToast('success', 'Sessions revoked', `${data.revokedCount} session(s) signed out.`);
                      loadSessions();
                    } else {
                      addToast('error', 'Failed', 'Could not revoke sessions.');
                    }
                  }}
                >
                  {revokingOthers ? 'Revoking...' : 'Sign out other devices'}
                </Button>
              )}
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No sessions found.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Monitor size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          Session {s.current && <Badge variant="success">Current</Badge>}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Expires {new Date(s.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
      </TabPanel>

      {/* Phase 1: Danger zone tab is hidden — keep sign-out reachable */}
      {MVP_MODE && (
        <Card className="border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
            </div>
            <Button variant="secondary" icon={<LogOut size={14} />} size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
