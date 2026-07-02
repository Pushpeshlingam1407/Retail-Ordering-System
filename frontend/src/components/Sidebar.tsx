import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "../context/AuthContext";
import notify from "../utils/notify";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: <DashboardIcon fontSize="small" />,
    adminOnly: true,
  },
  {
    label: "Products",
    to: "/products",
    icon: <InventoryIcon fontSize="small" />,
    adminOnly: true,
  },
  {
    label: "Coupons",
    to: "/coupons",
    icon: <LocalOfferIcon fontSize="small" />,
    adminOnly: true,
  },
  {
    label: "Orders",
    to: "/orders",
    icon: <ListAltIcon fontSize="small" />,
    adminOnly: true,
  },
  {
    label: "Shop",
    to: "/shop",
    icon: <StorefrontIcon fontSize="small" />,
    adminOnly: false,
  },
  {
    label: "My Orders",
    to: "/my-orders",
    icon: <ShoppingCartIcon fontSize="small" />,
    adminOnly: false,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  const filteredNav = NAV_ITEMS.filter((item) =>
    user?.role === "ADMIN" ? true : !item.adminOnly,
  );

  const handleLogout = () => {
    logout();
    notify.info("Signed out successfully.");
    navigate("/login");
  };

  const w = collapsed ? 72 : 260;

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && overlayRef.current === e.target)
        onMobileClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen, onMobileClose]);

  const sidebarContent = (
    <Box
      sx={{
        width: w,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(20px) saturate(190%)",
        borderRight: "1px solid #e6e4dd",
        transition: "width 200ms ease",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1 : 2,
          borderBottom: "1px solid #e6e4dd",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "6px",
                background: "#191919",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              R
            </Box>
            <Typography
              sx={{ fontSize: 16, fontWeight: 600, color: "#191919" }}
            >
              RetailOS
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "6px",
              background: "#191919",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            R
          </Box>
        )}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            display: { xs: "none", md: "flex" },
            ml: collapsed ? "auto" : 0,
            color: "#5e5e5e",
          }}
        >
          {collapsed ? (
            <MenuIcon fontSize="small" />
          ) : (
            <ChevronLeftIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: 2, px: collapsed ? 1 : 2 }}>
        <Stack spacing={0.5}>
          {filteredNav.map((item) => (
            <Tooltip
              key={item.to}
              title={collapsed ? item.label : ""}
              placement="right"
              arrow
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `nav-item${isActive ? " active" : ""}`
                }
                onClick={() => onMobileClose()}
                style={{
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px" : "10px 12px",
                }}
              >
                <Box
                  sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}
                >
                  {item.badge != null && item.badge > 0 ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </Box>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </Tooltip>
          ))}
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ p: 2, flexShrink: 0 }}>
        {collapsed ? (
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#f0ede6",
                color: "#191919",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {user?.name?.charAt(0) ?? "?"}
            </Avatar>
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ color: "#b91c1c" }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#f0ede6",
                color: "#191919",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {user?.name?.charAt(0) ?? "?"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: "#191919" }}
                noWrap
              >
                {user?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#5e5e5e" }} noWrap>
                {user?.email}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ color: "#5e5e5e" }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          flexShrink: 0,
          width: w,
          transition: "width 200ms ease",
        }}
      >
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 200,
          }}
        >
          {sidebarContent}
        </Box>
      </Box>
      {mobileOpen && (
        <Box
          ref={overlayRef}
          sx={{
            display: { xs: "flex", md: "none" },
            position: "fixed",
            inset: 0,
            zIndex: 400,
            background: "rgba(0,0,0,0.5)",
          }}
        >
          {sidebarContent}
        </Box>
      )}
    </>
  );
}
