import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Billing } from './pages/Billing';
import { Customers } from './pages/Customers';
import { BillsHistory } from './pages/BillsHistory';
import { Staff } from './pages/Staff';
import { Roles } from './pages/Roles';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="billing" element={<Billing />} />
            <Route path="customers" element={<Customers />} />
            <Route path="bills" element={<BillsHistory />} />
            <Route path="staff" element={<Staff />} />
            <Route path="roles" element={<Roles />} />
            <Route path="settings" element={<Settings />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
