import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShopSidebar } from './ShopSidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MobileFAB } from './MobileFAB';
import { OfflineBanner } from './OfflineBanner';
import { ShortcutsOverlay } from '../ui/ShortcutsOverlay';
import { WhatsNewModal } from '../ui/WhatsNewModal';

export function ShopLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ShopSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <OfflineBanner />
        <main className="flex-1 overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <MobileFAB />
      <ShortcutsOverlay />
      <WhatsNewModal />
    </div>
  );
}
