import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';
import type { AppModule } from '../../types';

interface NavItemDef {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  module: AppModule;
  end: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/shop',           icon: LayoutDashboard, label: 'Home',      module: 'dashboard', end: true  },
  { to: '/shop/billing',   icon: ShoppingCart,    label: 'Bill',      module: 'billing',   end: false },
  { to: '/shop/inventory', icon: Package,         label: 'Stock',     module: 'inventory', end: false },
  { to: '/shop/customers', icon: Users,           label: 'Customers', module: 'customers', end: false },
  { to: '/shop/bills',     icon: FileText,        label: 'Bills',     module: 'bills',     end: false },
  { to: '/shop/settings',  icon: Settings,        label: 'Settings',  module: 'settings',  end: false },
];

export function BottomNav() {
  const { canAccessModule } = usePermissions();

  const visible = NAV_ITEMS.filter(item => canAccessModule(item.module));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 lg:hidden">
      <div className="flex items-center justify-start h-16 px-1 gap-0 overflow-x-auto overflow-y-hidden scrollbar-thin">
        {visible.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 rounded-xl text-[10px] font-medium transition-colors shrink-0 min-w-[56px] ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
