import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { AppModule, ModuleAction, RolePermissions, ALL_MODULE_PERMISSIONS } from '../types';

interface PermissionContextValue {
  permissions: RolePermissions | null;
  can: (module: AppModule, action: ModuleAction) => boolean;
  canAccessModule: (module: AppModule) => boolean;
  isShopkeeper: boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

const SHOPKEEPER_PERMISSIONS: RolePermissions = {
  dashboard: { view: true, add: true, edit: true, delete: true },
  inventory: { view: true, add: true, edit: true, delete: true },
  billing: { view: true, add: true, edit: true, delete: true },
  customers: { view: true, add: true, edit: true, delete: true },
  bills: { view: true, add: true, edit: true, delete: true },
  staff: { view: true, add: true, edit: true, delete: true },
  roles: { view: true, add: true, edit: true, delete: true },
  settings: { view: true, add: true, edit: true, delete: true },
  subscription: { view: true, add: true, edit: true, delete: true },
  expenses: { view: true, add: true, edit: true, delete: true },
  suppliers: { view: true, add: true, edit: true, delete: true },
};

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, getStaffPermissions } = useAuth();

  const value = useMemo<PermissionContextValue>(() => {
    const isAdmin = user?.role === 'admin';
    const isShopkeeper = user?.role === 'shopkeeper';
    const isStaff = user?.role === 'staff';

    let permissions: RolePermissions | null = null;
    if (isShopkeeper) {
      permissions = SHOPKEEPER_PERMISSIONS;
    } else if (isStaff) {
      permissions = getStaffPermissions?.() ?? null;
    }

    const can = (module: AppModule, action: ModuleAction): boolean => {
      if (isAdmin) return true;
      if (isShopkeeper) return true;
      if (!permissions) return false;
      return permissions[module]?.[action] ?? false;
    };

    const canAccessModule = (module: AppModule): boolean => can(module, 'view');

    return { permissions, can, canAccessModule, isShopkeeper, isStaff, isAdmin };
  }, [user, getStaffPermissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
  return ctx;
}
