import { useState } from 'react';
import { Save, Building2, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export function AdminSettings() {
  const [company, setCompany] = useState({
    name: 'ShopManager Pvt. Ltd.',
    email: 'support@shopmanager.in',
    phone: '1800-123-4567',
    address: '42, Sector 18, Noida, UP 201301',
    website: 'www.shopmanager.in',
    gst: '09AABCS1429B1ZB',
  });

  const [billing, setBilling] = useState({
    currency: 'INR',
    taxRate: '18',
    invoicePrefix: 'SM-INV',
    paymentGateway: 'Razorpay',
  });

  const { addToast } = useToast();

  const saveCompany = () => addToast('success', 'Company info saved');
  const saveBilling = () => addToast('success', 'Billing settings saved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure platform-level settings.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Company Information</h2>
            <p className="text-xs text-gray-500">Public-facing company details.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input label="Company Name" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} />
            <Input label="Phone" value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} />
          </div>
          <Input label="Address" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Website" value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} />
            <Input label="GST Number" value={company.gst} onChange={e => setCompany({ ...company, gst: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={saveCompany}>
            Save changes
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Billing Settings</h2>
            <p className="text-xs text-gray-500">Configure how billing works for shops.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Currency" value={billing.currency} onChange={e => setBilling({ ...billing, currency: e.target.value })} />
            <Input label="Tax Rate (%)" value={billing.taxRate} onChange={e => setBilling({ ...billing, taxRate: e.target.value })} type="number" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Invoice Prefix" value={billing.invoicePrefix} onChange={e => setBilling({ ...billing, invoicePrefix: e.target.value })} />
            <Input label="Payment Gateway" value={billing.paymentGateway} onChange={e => setBilling({ ...billing, paymentGateway: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={saveBilling}>
            Save changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
