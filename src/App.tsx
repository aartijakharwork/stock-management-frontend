import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';

import { AdminLayout } from './components/layout/AdminLayout';
import { ShopLayout } from './components/layout/ShopLayout';

import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';

import { AdminDashboard } from './modules/admin/Dashboard';
import { ShopManagement } from './modules/admin/ShopManagement';
import { InviteShop } from './modules/admin/InviteShop';
import { SubscriptionManagement } from './modules/admin/SubscriptionManagement';
import { AdminSettings } from './modules/admin/AdminSettings';

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

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/shop'} replace />;
  }
  return <>{children}</>;
}

function AuthRedirect({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/shop'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth/login" element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/auth/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* Admin Panel */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="shops" element={<ShopManagement />} />
        <Route path="invite" element={<InviteShop />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Shop Panel — shopkeeper gets full access, staff gets permission-filtered */}
      <Route path="/shop" element={<ProtectedRoute allowedRoles={['shopkeeper', 'staff']}><ShopLayout /></ProtectedRoute>}>
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
