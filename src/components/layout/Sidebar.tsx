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
  PanelLeftClose,
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
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: 'Hot', badgeColor: 'bg-red-100 text-red-500' },
    ],
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
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[270px] flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transition-transform lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400">
              <Store size={20} className="text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-[var(--sidebar-text)]">
              ShopManager
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--sidebar-hover)] cursor-pointer lg:block">
            <PanelLeftClose size={18} className="text-[var(--sidebar-text-muted)] lg:block hidden" />
            <X size={18} className="text-[var(--sidebar-text-muted)] lg:hidden" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          {navGroups.map(group => (
            <div key={group.label} className="mb-1.5">
              <p className="mb-1 mt-5 px-3 text-[11px] font-bold uppercase tracking-widest text-[var(--sidebar-section-label)]">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ to, icon: Icon, label, badge, badgeColor }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]'
                          : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]'
                        }`
                      }
                    >
                      <Icon size={19} strokeWidth={1.8} />
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-[var(--sidebar-border)] px-4 py-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--sidebar-hover)] transition-colors cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-400 text-[13px] font-bold text-white">
              K
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--sidebar-text)]">Kumar Auto</p>
              <p className="truncate text-[11px] text-[var(--sidebar-text-muted)]">Owner</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
