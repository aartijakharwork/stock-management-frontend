import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, UserRole, RolePermissions } from '../types';
import { roles as dummyRoles } from '../data/shop-dummy';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => boolean;
  signup: (data: { shopName: string; ownerName: string; email: string; phone: string; password: string }) => boolean;
  logout: () => void;
  getStaffPermissions: () => RolePermissions | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERS: Record<UserRole, AuthUser> = {
  admin: {
    id: 'admin-1',
    name: 'Platform Admin',
    email: 'admin@shopmanager.in',
    phone: '9800000001',
    role: 'admin',
  },
  shopkeeper: {
    id: 'shop-1',
    name: 'Kumar Singh',
    email: 'kumar@autoparts.in',
    phone: '9876543200',
    role: 'shopkeeper',
    shopId: 'S001',
    shopName: 'Kumar Auto Parts',
  },
  staff: {
    id: 'staff-1',
    name: 'Rahul Mehta',
    email: 'rahul@kumarauto.in',
    phone: '9876543220',
    role: 'staff',
    shopId: 'S001',
    shopName: 'Kumar Auto Parts',
    staffRoleId: '1',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('shopmanager.auth');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const login = useCallback((email: string, _password: string, role: UserRole): boolean => {
    if (!email || !_password) return false;
    const allowedRoles: UserRole[] = ['shopkeeper', 'staff'];
    if (!allowedRoles.includes(role)) return false;
    const demoUser = DEMO_USERS[role];
    const loggedIn = { ...demoUser, email };
    setUser(loggedIn);
    localStorage.setItem('shopmanager.auth', JSON.stringify(loggedIn));
    return true;
  }, []);

  const signup = useCallback((data: { shopName: string; ownerName: string; email: string; phone: string; password: string }): boolean => {
    if (!data.shopName || !data.ownerName || !data.email || !data.password) return false;
    const newUser: AuthUser = {
      id: 'shop-new-' + Date.now(),
      name: data.ownerName,
      email: data.email,
      phone: data.phone,
      role: 'shopkeeper',
      shopId: 'S-NEW-' + Date.now(),
      shopName: data.shopName,
    };
    setUser(newUser);
    localStorage.setItem('shopmanager.auth', JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('shopmanager.auth');
  }, []);

  const getStaffPermissions = useCallback((): RolePermissions | null => {
    if (!user || user.role !== 'staff') return null;
    if (user.staffRoleId) {
      const role = dummyRoles.find(r => r.id === user.staffRoleId);
      return role?.permissions ?? null;
    }
    // Saved sessions without staffRoleId still need a role matrix (e.g. Cashier).
    return dummyRoles.find(r => r.id === '2')?.permissions ?? null;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, getStaffPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
