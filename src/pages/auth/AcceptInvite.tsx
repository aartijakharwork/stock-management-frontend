import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Store, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { api, setAccessToken } from '../../api/client';
import { validatePassword, PASSWORD_POLICY_HINT } from '../../utils/passwordPolicy';

interface InviteInfo {
  shopName: string;
  ownerEmail: string;
  plan: string;
}

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { addToast } = useToast();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    api(`/invitations/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setInviteInfo(data);
          setValid(true);
        } else {
          setValid(false);
        }
      })
      .catch(() => setValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validatePassword(password);
    if (!check.ok) { setError(check.error); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setSubmitting(true);

    try {
      const res = await api(`/invitations/${token}/accept`, {
        method: 'POST',
        body: JSON.stringify({ password, name: name || undefined, phone: phone || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        addToast('success', 'Welcome!', `Your shop "${inviteInfo?.shopName}" is ready.`);
        window.location.href = '/shop';
      } else {
        const data = await res.json().catch(() => ({ error: 'Failed to accept invitation' }));
        setError(data.error || 'Failed to accept invitation');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/20 mb-4">
            <Store size={28} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid invitation</h1>
          <p className="text-sm text-gray-500 mb-6">This invite link is invalid, expired, or has already been used.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join {inviteInfo!.shopName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            You've been invited as shop owner. Set your password to get started.
          </p>
          <p className="mt-1 text-xs text-gray-400">{PASSWORD_POLICY_HINT}</p>
          <p className="mt-1 text-xs text-gray-400">{inviteInfo!.ownerEmail} &middot; {inviteInfo!.plan} plan</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kumar Singh"
            />
            <Input
              label="Phone (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="10-digit number"
              inputMode="tel"
              maxLength={10}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Setting up...' : 'Create account & enter shop'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
