import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

type Step = 'email' | 'otp' | 'reset';

export function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email or phone is required'); return; }
    setError('');
    addToast('success', 'OTP sent', `Verification code sent to ${email}`);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) { setError('Enter a valid OTP'); return; }
    setError('');
    setStep('reset');
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Min 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    addToast('success', 'Password reset', 'You can now sign in with your new password');
    setStep('email');
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'email' && 'Forgot password?'}
            {step === 'otp' && 'Enter verification code'}
            {step === 'reset' && 'Set new password'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 'email' && "No worries. We'll send you a reset code."}
            {step === 'otp' && `We sent a code to ${email}`}
            {step === 'reset' && 'Choose a strong password for your account.'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Email or Phone"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your registered email or phone"
                error={error}
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" icon={<Mail size={16} />}>
                Send reset code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                label="Verification Code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                error={error}
                inputMode="numeric"
                maxLength={6}
              />
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Verify code
              </Button>
              <button
                type="button"
                onClick={() => addToast('info', 'OTP resent', `New code sent to ${email}`)}
                className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
              >
                Resend code
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                error={error && password.length < 6 ? error : undefined}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                error={error && password !== confirmPassword ? error : undefined}
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" icon={<KeyRound size={16} />}>
                Reset password
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
