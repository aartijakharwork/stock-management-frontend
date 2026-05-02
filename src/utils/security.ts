// Single source of truth for the shopkeeper's optional 4-digit "settle" PIN
// (configured in Settings). Reads from localStorage so it stays consistent
// across pages.
export interface SecuritySettings {
  enabled: boolean;
  code: string;
}

export function getSecuritySettings(): SecuritySettings {
  if (typeof window === 'undefined') return { enabled: false, code: '' };
  const enabled = localStorage.getItem('shopmanager.security.enabled') === 'true';
  const code = localStorage.getItem('shopmanager.security.code') || '';
  return { enabled, code };
}

export function isSecurityCodeValid(input: string): boolean {
  const { code } = getSecuritySettings();
  return input.trim() === code;
}
