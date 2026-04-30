import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, UserCog, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof Store; desc: string }[] = [
  { value: 'shopkeeper', label: 'Shop Owner', icon: Store, desc: 'Shop owner login' },
  { value: 'staff', label: 'Staff', icon: UserCog, desc: 'Staff member login' },
];

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('shopkeeper');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email or phone is required';
    if (!password.trim()) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const success = login(email, password, role);
    if (success) {
      addToast('success', 'Login successful', `Welcome back!`);
      navigate('/shop');
    } else {
      addToast('error', 'Login failed', 'Invalid credentials');
    }
  };

  const placeholders: Record<UserRole, string> = {
    admin: 'admin@shopmanager.in',
    shopkeeper: 'kumar@autoparts.in',
    staff: 'rahul@kumarauto.in',
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to manage your shop</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex gap-2 mb-6">
            {ROLE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors border ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Phone"
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={placeholders[role]}
              error={errors.email}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Demo: enter any email & password. Choose role above.
            </p>
          </div>
        </div>

        {role !== 'staff' && (
          <p className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium">
              Register your shop
            </Link>
          </p>
        )}
        {role === 'staff' && (
          <p className="text-center mt-6 text-sm text-gray-500">
            Ask your shop owner for an invite link to join.
          </p>
        )}
      </div>
    </div>
  );
}
