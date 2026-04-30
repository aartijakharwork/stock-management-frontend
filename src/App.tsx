import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';

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

import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth/login" element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/auth/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* Shop Portal — shopkeeper gets full access, staff gets permission-filtered */}
      <Route path="/shop" element={<ProtectedRoute><ShopLayout /></ProtectedRoute>}>
        <Route index element={<ShopDashboard />} />
        <Route path="inventory" element={<ShopInventory />} />
        <Route path="billing" element={<ShopBilling />} />
        <Route path="customers" element={<ShopCustomers />} />
        <Route path="bills" element={<ShopBillsHistory />} />
        <Route path="staff" element={<ShopStaff />} />
        <Route path="roles" element={<ShopRoles />} />
        <Route path="settings" element={<ShopSettings />} />
        <Route path="subscription" element={<ShopSubscription />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PermissionProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
              <ToastContainer />
            </BrowserRouter>
          </ToastProvider>
        </PermissionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
