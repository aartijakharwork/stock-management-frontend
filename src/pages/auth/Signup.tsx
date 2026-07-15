import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export function Signup() {
  const [form, setForm] = useState({ shopName: '', ownerName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.shopName.trim()) errs.shopName = 'Shop name is required';
    if (!form.ownerName.trim()) errs.ownerName = 'Owner name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.password) errs.password = 'Password is required';
    if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addToast('info', 'Registration is invite-only', 'New shops are created by the platform admin. Use Sign in if you already have an account.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Register your shop</h1>
          <p className="mt-1 text-sm text-gray-500">Get started with ShopManager in minutes</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Shop Name"
              value={form.shopName}
              onChange={e => update('shopName', e.target.value)}
              placeholder="e.g. Kumar Auto Parts"
              error={errors.shopName}
            />
            <Input
              label="Owner Name"
              value={form.ownerName}
              onChange={e => update('ownerName', e.target.value)}
              placeholder="e.g. Kumar Singh"
              error={errors.ownerName}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@email.com"
                error={errors.email}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="10-digit number"
                error={errors.phone}
                inputMode="tel"
              />
            </div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Min 6 characters"
                error={errors.password}
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
              value={form.confirmPassword}
              onChange={e => update('confirmPassword', e.target.value)}
              placeholder="Re-enter password"
              error={errors.confirmPassword}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
