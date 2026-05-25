import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Box, CssBaseline, Toolbar, Typography, AppBar,
  IconButton, Avatar, Divider,
  Menu, MenuItem as MuiMenuItem, Chip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ShopPage from './pages/ShopPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CouponsPage from './pages/CouponsPage';
import OrderNotificationPage from './pages/OrderNotificationPage';

// ─── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/my-orders" replace />;
  return <>{children}</>;
}

function TopAppBar() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    toast.info('Signed out.');
    setAnchorEl(null);
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{ backdropFilter: 'blur(14px)', bgcolor: 'rgba(15, 23, 42, 0.92)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexGrow: 1 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontWeight: 800 }}>R</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={0.8} sx={{ lineHeight: 1.1 }}>RetailOS</Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>Ordering platform</Typography>
          </Box>
        </Box>
        {user && (
          <>
            <Chip
              size="small"
              icon={user.role === 'ADMIN' ? <AdminPanelSettingsIcon sx={{ fontSize: '14px !important' }} /> : <PersonIcon sx={{ fontSize: '14px !important' }} />}
              label={user.role}
              sx={{ mr: 1.5, bgcolor: user.role === 'ADMIN' ? '#6366f133' : '#10b98133', color: 'white', fontWeight: 700 }}
            />
            <IconButton color="inherit" onClick={e => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'rgba(255,255,255,0.3)' }}>
                {user.name.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MuiMenuItem disabled>
                <Typography variant="caption">{user.email}</Typography>
              </MuiMenuItem>
              <Divider />
              <MuiMenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Sign Out
              </MuiMenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

// ─── Authenticated layout ─────────────────────────────────────────────────────
function AppLayout() {
  const { user } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
      <CssBaseline />
      <TopAppBar />
      <Toolbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          pt: { xs: 3, md: 4 },
          maxWidth: '100%',
          overflow: 'auto',
        }}
      >
        <Routes>
          {/* Admin-only routes */}
          <Route path="/" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute adminOnly><ProductsPage /></ProtectedRoute>} />
          <Route path="/coupons" element={<ProtectedRoute adminOnly><CouponsPage /></ProtectedRoute>} />

          {/* Shared routes (both roles) */}
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/order-notification" element={<ProtectedRoute><OrderNotificationPage /></ProtectedRoute>} />

          {/* User-only dashboard */}
          <Route path="/my-orders" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={
            user?.role === 'ADMIN' ? <Navigate to="/" replace /> : <Navigate to="/my-orders" replace />
          } />
        </Routes>
      </Box>
    </Box>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <SignUpPage />}
      />
      <Route path="/*" element={
        isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
