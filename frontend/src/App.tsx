import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  Box, CssBaseline, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, AppBar,
  IconButton, useMediaQuery, useTheme, Avatar, Divider,
  Menu, MenuItem as MuiMenuItem, Chip, Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CouponsPage from './pages/CouponsPage';

const DRAWER_WIDTH = 240;

// ─── Nav items per role ────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Products',  icon: <InventoryIcon />, path: '/products' },
  { label: 'Orders',    icon: <ShoppingCartIcon />, path: '/orders' },
  { label: 'Coupons',   icon: <LocalOfferIcon />, path: '/coupons' },
];

const USER_NAV = [
  { label: 'My Dashboard', icon: <DashboardIcon />,    path: '/my-orders' },
  { label: 'Orders',       icon: <ShoppingCartIcon />, path: '/orders' },
];

// ─── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/my-orders" replace />;
  return <>{children}</>;
}

// ─── Side navigation ───────────────────────────────────────────────────────────
function SideNav({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user?.role === 'ADMIN' ? ADMIN_NAV : USER_NAV;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 46, height: 46, fontSize: 20, fontWeight: 800 }}>R</Avatar>
          <Typography variant="subtitle1" fontWeight={800} color="primary.main" letterSpacing={1}>
            RetailOS
          </Typography>
          {user && (
            <Chip
              size="small"
              icon={user.role === 'ADMIN' ? <AdminPanelSettingsIcon sx={{ fontSize: '14px !important' }} /> : <PersonIcon sx={{ fontSize: '14px !important' }} />}
              label={user.role}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: user.role === 'ADMIN' ? '#6366f118' : '#10b98118',
                color: user.role === 'ADMIN' ? '#6366f1' : '#10b981',
              }}
            />
          )}
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, mt: 1, flexGrow: 1 }}>
        {navItems.map(item => {
          const active =
            location.pathname === item.path ||
            (item.path !== '/' && item.path !== '/my-orders' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onClose}
                sx={{
                  borderRadius: 2,
                  color: active ? 'primary.main' : 'text.secondary',
                  bgcolor: active ? 'primary.main' + '18' : 'transparent',
                  '&:hover': { bgcolor: 'primary.main' + '12' },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 400, fontSize: 14 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User info at bottom */}
      {user && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: user.role === 'ADMIN' ? 'primary.main' : 'success.main' }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={700} noWrap display="block">{user.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.65rem' }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Top AppBar (mobile) with logout ──────────────────────────────────────────
function MobileAppBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    toast.info('Signed out.');
    setAnchorEl(null);
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: t => t.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800} letterSpacing={1} sx={{ flexGrow: 1 }}>RetailOS</Typography>
        {user && (
          <>
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

// ─── Desktop Top-right logout button ──────────────────────────────────────────
function DesktopHeader() {
  const { user, logout } = useAuth();
  const handleLogout = () => { logout(); toast.info('Signed out.'); };

  if (!user) return null;
  return (
    <Box sx={{
      position: 'fixed', top: 16, right: 24, zIndex: 1200,
      display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Chip
        avatar={<Avatar sx={{ bgcolor: user.role === 'ADMIN' ? '#6366f1' : '#10b981', width: 24, height: 24, fontSize: 12 }}>{user.name.charAt(0)}</Avatar>}
        label={user.name}
        variant="outlined"
        size="small"
        sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'background.paper' }}
      />
      <Tooltip title="Sign out">
        <IconButton
          onClick={handleLogout}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            '&:hover': { bgcolor: '#fee2e2', borderColor: '#ef4444', color: '#ef4444' },
          }}
        >
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Authenticated layout ─────────────────────────────────────────────────────
function AppLayout() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      {isMobile ? (
        <>
          <MobileAppBar onMenuClick={() => setMobileOpen(true)} />
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            <SideNav onClose={() => setMobileOpen(false)} />
          </Drawer>
        </>
      ) : (
        <>
          <DesktopHeader />
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH, flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH, boxSizing: 'border-box',
                border: 'none', boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
              },
            }}
          >
            <SideNav />
          </Drawer>
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          pt: { xs: 10, md: 4 },
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

          {/* User-only dashboard */}
          <Route path="/my-orders" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />

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
          theme="colored"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
