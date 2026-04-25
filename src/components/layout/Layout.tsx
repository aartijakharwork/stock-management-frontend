import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/billing': 'Billing',
  '/customers': 'Customers',
  '/bills': 'Bills History',
  '/staff': 'Staff Management',
  '/roles': 'Role Management',
  '/settings': 'Settings',
  '/subscription': 'Subscription',
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'ShopManager';

  return (
    <div className="min-h-screen relative bg-gray-50 dark:bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-gray-50 to-cyan-100 dark:from-purple-900/10 dark:via-black dark:to-cyan-900/10 pointer-events-none" />

      {/* Cyan grid — light variant (deeper hint, slightly higher opacity to read on white) */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(8,145,178,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.4) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      {/* Cyan grid — dark variant */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none hidden dark:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,217,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

      <main className="relative lg:pl-64 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
