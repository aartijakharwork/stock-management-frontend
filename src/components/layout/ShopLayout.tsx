import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShopSidebar } from './ShopSidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MobileFAB } from './MobileFAB';
import { OfflineBanner } from './OfflineBanner';
import { PageTransition } from './PageTransition';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { ShortcutsOverlay } from '../ui/ShortcutsOverlay';
import { WhatsNewModal } from '../ui/WhatsNewModal';
import { MVP_HIDE_SHORTCUTS_OVERLAY, MVP_HIDE_WHATSNEW_MODAL } from '../../config/mvp';

export function ShopLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ShopSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <OfflineBanner />
        <main className="flex-1 overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
      <MobileFAB />
      {!MVP_HIDE_SHORTCUTS_OVERLAY && <ShortcutsOverlay />}
      {!MVP_HIDE_WHATSNEW_MODAL && <WhatsNewModal />}
    </div>
  );
}
