import { useState } from 'react';
import { Send, Copy, Link2, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export function InviteShop() {
  const [form, setForm] = useState({ shopName: '', ownerName: '', email: '', phone: '', plan: 'Standard' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteSent, setInviteSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.shopName.trim()) errs.shopName = 'Required';
    if (!form.ownerName.trim()) errs.ownerName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setInviteSent(true);
    addToast('success', 'Invite sent', `Invitation sent to ${form.email}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('https://shopmanager.in/invite/abc123');
    setCopied(true);
    addToast('info', 'Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setForm({ shopName: '', ownerName: '', email: '', phone: '', plan: 'Standard' });
    setErrors({});
    setInviteSent(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invite Shop</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new shop to the platform or send an invite link.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Create Shop Directly</h2>
          <p className="text-sm text-gray-500 mb-5">Fill in the details to register a new shop on the platform.</p>

          {inviteSent ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-4">
                <Check size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite Sent!</h3>
              <p className="mt-1 text-sm text-gray-500">An invitation has been sent to {form.email}</p>
              <Button variant="secondary" className="mt-4" onClick={handleReset}>Invite another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Shop Name" value={form.shopName} onChange={e => update('shopName', e.target.value)} placeholder="e.g. Sharma Electronics" error={errors.shopName} />
              <Input label="Owner Name" value={form.ownerName} onChange={e => update('ownerName', e.target.value)} placeholder="e.g. Rakesh Sharma" error={errors.ownerName} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="owner@email.com" error={errors.email} />
                <Input label="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="10-digit number" inputMode="tel" />
              </div>
              <Dropdown
                label="Plan"
                options={[
                  { label: 'Basic — ₹299/mo', value: 'Basic' },
                  { label: 'Standard — ₹599/mo', value: 'Standard' },
                  { label: 'Pro — ₹999/mo', value: 'Pro' },
                ]}
                value={form.plan}
                onChange={e => update('plan', e.target.value)}
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" icon={<Send size={16} />}>
                Send invite
              </Button>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Share Invite Link</h2>
          <p className="text-sm text-gray-500 mb-5">Copy this link and share it with the shop owner to self-register.</p>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Registration Link</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value="https://shopmanager.in/invite/abc123"
                className="flex-1 h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 text-sm text-gray-700 dark:text-gray-300"
              />
              <Button variant="secondary" size="md" icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Link expires in 7 days</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">After expiry, you can generate a new link from this page.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
