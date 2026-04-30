import {
  Menu, Bell, Sun, Moon, LogOut, ChevronDown,
  AlertTriangle, Clock, CheckCircle2, Receipt, UserPlus, Package, CreditCard, X as XIcon,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatters';

type NotificationKind = 'warning' | 'success' | 'info' | 'danger';

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  icon: React.ReactNode;
  title: string;
  description: string;
  at: string;
  unread: boolean;
  to?: string;
}

const NOW = Date.now();
const AT = (offsetMinutes: number) => new Date(NOW - offsetMinutes * 60 * 1000).toISOString();

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', kind: 'danger',  icon: <AlertTriangle size={14} />, title: 'Battery 12V 65Ah is critically low', description: 'Only 3 units left · ₹4,500 each', at: AT(8),    unread: true,  to: '/shop/inventory' },
  { id: 'n2', kind: 'warning', icon: <Clock size={14} />,         title: 'Vikram Singh\'s udhaar is overdue',  description: '₹4,800 pending for 12 days',     at: AT(45),   unread: true,  to: '/shop/customers' },
  { id: 'n3', kind: 'success', icon: <CheckCircle2 size={14} />,  title: 'Payment received',                    description: 'Sunil Sharma cleared ₹1,500',     at: AT(120),  unread: true,  to: '/shop/customers' },
  { id: 'n4', kind: 'info',    icon: <Receipt size={14} />,       title: 'Bill generated',                      description: 'INV-2026-04-0102 · ₹2,430',       at: AT(180),  unread: false, to: '/shop/bills' },
  { id: 'n5', kind: 'warning', icon: <Package size={14} />,       title: 'Radiator Hose is running low',        description: 'Only 2 units left · reorder soon', at: AT(420),  unread: false, to: '/shop/inventory' },
  { id: 'n6', kind: 'info',    icon: <CreditCard size={14} />,    title: 'Subscription renews in 12 days',     description: 'Professional plan · ₹3,499/yr',   at: AT(60 * 36), unread: false, to: '/shop/subscription' },
  { id: 'n7', kind: 'success', icon: <UserPlus size={14} />,      title: 'Anita Sharma joined your team',       description: 'Accepted invite · Cashier',       at: AT(60 * 56), unread: false, to: '/shop/staff' },
  { id: 'n8', kind: 'info',    icon: <UserPlus size={14} />,      title: 'New customer added',                   description: 'Hari Prasad · 9876543219',        at: AT(60 * 80), unread: false, to: '/shop/customers' },
];

const kindStyles: Record<NotificationKind, string> = {
  danger:  'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  info:    'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  const onNotifClick = (n: NotificationItem) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x));
    setNotifOpen(false);
    if (n.to) navigate(n.to);
  };

  const groupedNotifications = (() => {
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    for (const n of notifications) {
      if (Date.now() - new Date(n.at).getTime() < dayMs) today.push(n);
      else earlier.push(n);
    }
    return { today, earlier };
  })();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 shadow-sm">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-gray-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold tabular-nums">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label="Close"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-[440px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                    <p className="mt-2 text-sm text-gray-500">You're all caught up</p>
                  </div>
                ) : (
                  <>
                    {groupedNotifications.today.length > 0 && (
                      <>
                        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-gray-400">Today</p>
                        <ul>
                          {groupedNotifications.today.map(n => (
                            <li key={n.id}>
                              <button
                                onClick={() => onNotifClick(n)}
                                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${n.unread ? 'bg-emerald-50/40 dark:bg-emerald-500/5' : ''}`}
                              >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kindStyles[n.kind]}`}>
                                  {n.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm ${n.unread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">{n.description}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(n.at)}</p>
                                </div>
                                {n.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {groupedNotifications.earlier.length > 0 && (
                      <>
                        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-gray-400">Earlier</p>
                        <ul>
                          {groupedNotifications.earlier.map(n => (
                            <li key={n.id}>
                              <button
                                onClick={() => onNotifClick(n)}
                                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${n.unread ? 'bg-emerald-50/40 dark:bg-emerald-500/5' : ''}`}
                              >
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kindStyles[n.kind]}`}>
                                  {n.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm ${n.unread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">{n.description}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(n.at)}</p>
                                </div>
                                {n.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
                <button
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setNotifOpen(false)}
                >
                  Notification settings
                </button>
                <button
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  onClick={() => setNotifOpen(false)}
                >
                  View all
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
