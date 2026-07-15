export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.';

export const PASSWORD_POLICY_HINT =
  '8+ characters with uppercase, lowercase, a number, and a symbol (!@#…).';

export function validatePassword(password: string): { ok: true } | { ok: false; error: string } {
  if (!password || password.length < 8) {
    return { ok: false, error: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, error: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { ok: false, error: PASSWORD_POLICY_MESSAGE };
  }
  return { ok: true };
}
