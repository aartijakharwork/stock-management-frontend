import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { ToastProvider } from './context/ToastContext';
import { ShopCatalogProvider } from './context/ShopCatalogContext';
import { CatalogueProvider } from './context/CatalogueContext';
import { ToastContainer } from './components/ui/Toast';
import { isPathHidden, MVP_HIDE_COMMAND_PALETTE } from './config/mvp';

import { ShopLayout } from './components/layout/ShopLayout';

import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { AcceptInvite } from './pages/auth/AcceptInvite';
import { JoinStaff } from './pages/auth/JoinStaff';

import { ShopDashboard } from './modules/shop/Dashboard';
import { ShopInventory } from './modules/shop/Inventory';
import { ShopBilling } from './modules/shop/Billing';
import { ShopCustomers } from './modules/shop/Customers';
import { ShopBillsHistory } from './modules/shop/BillsHistory';
import { ShopStaff } from './modules/shop/Staff';
import { ShopRoles } from './modules/shop/Roles';
import { ShopSettings } from './modules/shop/Settings';
import { ShopSubscription } from './modules/shop/Subscription';
import { ShopReports } from './modules/shop/Reports';
import { ShopExpenses } from './modules/shop/Expenses';
import { ShopSuppliers } from './modules/shop/Suppliers';
import { ShopCustomerLedger } from './modules/shop/CustomerLedger';
import { ShopCatalogue } from './modules/shop/Catalogue';
import { CommandPalette } from './components/ui/CommandPalette';

import type { ReactNode } from 'react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function MvpGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (isPathHidden(location.pathname)) return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

function GlobalShell() {
  return (
    <>
      <Outlet />
      {!MVP_HIDE_COMMAND_PALETTE && <CommandPalette />}
      <ToastContainer />
    </>
  );
}

function CatchAllRedirect() {
  const location = useLocation();
  if (location.pathname.startsWith('/shop')) {
    return <Navigate to="/shop" replace />;
  }
  return <Navigate to="/auth/login" replace />;
}

const router = createBrowserRouter([
  {
    element: <GlobalShell />,
    children: [
      { path: '/', element: <Navigate to="/auth/login" replace /> },
      { path: '/auth/login', element: <AuthRedirect><Login /></AuthRedirect> },
      { path: '/auth/forgot-password', element: <ForgotPassword /> },
      { path: '/auth/reset-password', element: <ResetPassword /> },
      { path: '/auth/invite/:token', element: <AcceptInvite /> },
      { path: '/auth/join/:token', element: <JoinStaff /> },
      {
        path: '/shop',
        element: (
          <ProtectedRoute>
            <MvpGuard>
              <ShopLayout />
            </MvpGuard>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ShopDashboard /> },
          { path: 'catalogue', element: <ShopCatalogue /> },
          { path: 'inventory', element: <ShopInventory /> },
          { path: 'categories', element: <Navigate to="/shop/settings?tab=categories" replace /> },
          { path: 'billing', element: <ShopBilling /> },
          { path: 'customers', element: <ShopCustomers /> },
          { path: 'customers/:id', element: <ShopCustomerLedger /> },
          { path: 'bills', element: <ShopBillsHistory /> },
          { path: 'expenses', element: <ShopExpenses /> },
          { path: 'suppliers', element: <ShopSuppliers /> },
          { path: 'staff', element: <ShopStaff /> },
          { path: 'roles', element: <ShopRoles /> },
          { path: 'settings', element: <ShopSettings /> },
          { path: 'subscription', element: <ShopSubscription /> },
          { path: 'reports', element: <ShopReports /> },
        ],
      },
      { path: '*', element: <CatchAllRedirect /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ShopCatalogProvider>
          <CatalogueProvider>
            <PermissionProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </PermissionProvider>
          </CatalogueProvider>
        </ShopCatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
