import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  UserCog,
  Shield,
  Settings,
  CreditCard,
  X,
  Store,
  Wallet,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { isModuleVisible } from '../../config/mvp';
import type { AppModule } from '../../types';

interface ShopSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  module: AppModule;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/shop', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/shop/billing', icon: ShoppingCart, label: 'New Bill', module: 'billing' },
      { to: '/shop/inventory', icon: Package, label: 'Inventory', module: 'inventory' },
      { to: '/shop/customers', icon: Users, label: 'Customers', module: 'customers' },
      { to: '/shop/bills', icon: FileText, label: 'Bills History', module: 'bills' },
      { to: '/shop/expenses', icon: Wallet, label: 'Expenses', module: 'expenses' },
      { to: '/shop/suppliers', icon: Truck, label: 'Suppliers', module: 'suppliers' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/shop/staff', icon: UserCog, label: 'Staff', module: 'staff' },
      { to: '/shop/roles', icon: Shield, label: 'Roles', module: 'roles' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/shop/settings', icon: Settings, label: 'Settings', module: 'settings' },
      { to: '/shop/subscription', icon: CreditCard, label: 'Subscription', module: 'subscription' },
    ],
  },
];

export function ShopSidebar({ open, onClose }: ShopSidebarProps) {
  const { user } = useAuth();
  const { canAccessModule, isStaff } = usePermissions();
  const shopName = user?.shopName || 'My Shop';
  const initial = shopName.charAt(0).toUpperCase();

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => canAccessModule(item.module) && isModuleVisible(item.module)),
  })).filter(group => group.items.length > 0);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{shopName}</p>
              <p className="text-[11px] text-gray-500">{isStaff ? 'Staff Portal' : 'Shop Dashboard'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {filteredGroups.map(group => (
            <div key={group.label} className="mt-4 first:mt-2">
              <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onClose}
                      end={to === '/shop'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <Icon size={18} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
