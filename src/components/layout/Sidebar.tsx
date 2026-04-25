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
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Apps',
    items: [
      { to: '/billing', icon: ShoppingCart, label: 'Billing' },
      { to: '/inventory', icon: Package, label: 'Inventory' },
      { to: '/customers', icon: Users, label: 'Customers' },
      { to: '/bills', icon: FileText, label: 'Bills History' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/staff', icon: UserCog, label: 'Staff' },
      { to: '/roles', icon: Shield, label: 'Roles' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/subscription', icon: CreditCard, label: 'Subscription' },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white/90 dark:bg-black/80 backdrop-blur-sm border-r border-gray-200 dark:border-white/10 transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-100 dark:from-purple-500/20 to-cyan-100 dark:to-cyan-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center">
              <Store size={22} className="text-purple-700 dark:text-purple-300" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 dark:text-white text-[15px] font-bold leading-tight">
                ShopManager
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mt-0.5">
                Shop dashboard
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 px-3 mb-2 mt-6">
                {group.label}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onClose}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'text-gray-900 dark:text-white bg-white dark:bg-white/5 border border-cyan-300 dark:border-cyan-400/40'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      <span className="flex-1">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-white/5 p-3">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-200 dark:from-purple-500/40 to-cyan-200 dark:to-cyan-500/40 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white text-[13px] font-bold flex-shrink-0">
              K
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-gray-900 dark:text-white text-[13px] font-semibold">
                Kumar Auto
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-0.5">
                Owner
              </p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
