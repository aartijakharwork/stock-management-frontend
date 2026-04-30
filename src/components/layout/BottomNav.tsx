import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';

const NAV_ITEMS = [
  { to: '/shop', icon: LayoutDashboard, label: 'Home', module: 'dashboard' as const, end: true },
  { to: '/shop/billing', icon: ShoppingCart, label: 'Bill', module: 'billing' as const, end: false },
  { to: '/shop/inventory', icon: Package, label: 'Stock', module: 'inventory' as const, end: false },
  { to: '/shop/customers', icon: Users, label: 'Customers', module: 'customers' as const, end: false },
  { to: '/shop/reports', icon: BarChart3, label: 'Reports', module: 'dashboard' as const, end: false },
];

export function BottomNav() {
  const { canAccessModule } = usePermissions();

  const visible = NAV_ITEMS.filter(item => canAccessModule(item.module));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {visible.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-colors min-w-[52px] ${
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
