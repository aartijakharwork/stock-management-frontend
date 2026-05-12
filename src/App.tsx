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
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';

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

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

// In MVP mode, redirect any module that's been hidden from nav back to the
// dashboard. The route + component are still mounted-on-demand for power
// users (set MVP_MODE = false in src/config/mvp.ts).
function MvpGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (isPathHidden(location.pathname)) return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

/** Renders matched route + global overlays. Must sit under RouterProvider so hooks work. */
function GlobalShell() {
  return (
    <>
      <Outlet />
      {!MVP_HIDE_COMMAND_PALETTE && <CommandPalette />}
      <ToastContainer />
    </>
  );
}

/** Unknown URLs under /shop stay in the app; anything else goes to login. */
function CatchAllRedirect() {
  const location = useLocation();
  if (location.pathname.startsWith('/shop')) {
    return <Navigate to="/shop" replace />;
  }
  return <Navigate to="/auth/login" replace />;
}

// Data router enables useBlocker (e.g. UnsavedChangesGuard in Settings).
const router = createBrowserRouter([
  {
    element: <GlobalShell />,
    children: [
      { path: '/', element: <Navigate to="/auth/login" replace /> },
      { path: '/auth/login', element: <AuthRedirect><Login /></AuthRedirect> },
      { path: '/auth/signup', element: <AuthRedirect><Signup /></AuthRedirect> },
      { path: '/auth/forgot-password', element: <ForgotPassword /> },
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
