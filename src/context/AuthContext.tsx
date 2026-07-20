import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { AuthUser, RolePermissions } from '../types';
import { api, setAccessToken, getAccessToken, refreshAccessToken } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  getStaffPermissions: () => RolePermissions | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Decode JWT payload to extract expiry time (ms). No signature verification needed. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function mapApiUser(data: Record<string, unknown>): AuthUser {
  return {
    id: data.id as string,
    name: data.name as string,
    email: data.email as string,
    phone: (data.phone as string) || '',
    role: data.globalRole === 'super_admin' ? 'admin' : (data.membershipRole as string) === 'staff' ? 'staff' : 'shopkeeper',
    shopId: data.shopId as string | undefined,
    shopName: data.shopName as string | undefined,
    staffRoleId: data.staffRoleId as string | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const staffPermissionsRef = useRef<RolePermissions | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(mapApiUser(data));
          if (data.permissions) {
            staffPermissionsRef.current = data.permissions as RolePermissions;
          }
        } else {
          setAccessToken(null);
        }
      })
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Proactive token refresh: schedule a refresh ~60s before the access token expires
  useEffect(() => {
    if (!user) return;

    function scheduleRefresh() {
      const token = getAccessToken();
      if (!token) return undefined;

      const expiry = getTokenExpiry(token);
      if (!expiry) return undefined;

      const now = Date.now();
      // Refresh 60 seconds before expiry, but at least 5 seconds from now
      const delay = Math.max(expiry - now - 60_000, 5_000);

      return window.setTimeout(async () => {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Recursively schedule the next refresh for the new token
          timerRef = scheduleRefresh();
        }
      }, delay);
    }

    let timerRef = scheduleRefresh();
    return () => {
      if (timerRef != null) clearTimeout(timerRef);
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, intent: 'shop' }),
      });

      const data = await res.json().catch(() => ({ error: 'Login failed' }));
      if (!res.ok) return { ok: false, error: data.error || 'Login failed' };

      setAccessToken(data.accessToken);
      setUser(mapApiUser(data.user));
      if (data.user.permissions) {
        staffPermissionsRef.current = data.user.permissions as RolePermissions;
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setAccessToken(null);
    setUser(null);
    staffPermissionsRef.current = null;
  }, []);

  const getStaffPermissions = useCallback((): RolePermissions | null => {
    return staffPermissionsRef.current;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, getStaffPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
