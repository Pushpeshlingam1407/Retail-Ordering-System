import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ShopPage from './pages/ShopPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CouponsPage from './pages/CouponsPage';
import OrderNotificationPage from './pages/OrderNotificationPage';
import UserOrdersPage from './pages/UserOrdersPage';

import AdminLoginPage from './pages/AdminLoginPage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/shop" replace />;
  return <>{children}</>;
}

function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: `${sidebarWidth}px` }, transition: 'margin-left 200ms ease' }}>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', height: 56, px: 2, background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
          <IconButton size="small" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
          <Box sx={{ fontSize: 16, fontWeight: 700 }}>RetailOS</Box>
        </Box>
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: '100%' }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute adminOnly><ProductsPage /></ProtectedRoute>} />
            <Route path="/coupons" element={<ProtectedRoute adminOnly><CouponsPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute adminOnly><OrdersPage /></ProtectedRoute>} />
            <Route path="/order-notification" element={<ProtectedRoute><OrderNotificationPage /></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><UserOrdersPage /></ProtectedRoute>} />
            <Route path="*" element={user?.role === 'ADMIN' ? <Navigate to="/" replace /> : <Navigate to="/shop" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'ADMIN' ? '/' : '/shop'} replace /> : <LoginPage />} />
      <Route path="/admin-login" element={isAuthenticated ? <Navigate to={user?.role === 'ADMIN' ? '/' : '/shop'} replace /> : <AdminLoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={user?.role === 'ADMIN' ? '/' : '/shop'} replace /> : <SignUpPage />} />
      <Route path="/*" element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-right" gutter={8} />
      </AuthProvider>
    </BrowserRouter>
  );
}
