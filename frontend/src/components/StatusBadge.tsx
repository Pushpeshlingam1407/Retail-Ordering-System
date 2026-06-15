import { Box } from "@mui/material";

export default function StatusBadge({
  status,
  onClick,
  size = "md",
}: {
  status: string;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const cfg: Record<string, { label: string; color: string; bgcolor: string }> =
    {
      PENDING: { label: "Pending", color: "#b45309", bgcolor: "#fdf6e2" },
      CONFIRMED: { label: "Confirmed", color: "#1d4ed8", bgcolor: "#edf2fe" },
      SHIPPED: { label: "Shipped", color: "#6d28d9", bgcolor: "#f5f0ff" },
      DELIVERED: { label: "Delivered", color: "#15803d", bgcolor: "#edf7ed" },
      CANCELLED: { label: "Cancelled", color: "#b91c1c", bgcolor: "#fdf2f2" },
    };

  const current = cfg[status] || {
    label: status,
    color: "#5e5e5e",
    bgcolor: "#f3f1eb",
  };

  const isSm = size === "sm";

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: isSm ? 1 : 1.25,
        py: isSm ? 0.35 : 0.5,
        borderRadius: "6px",
        bgcolor: current.bgcolor,
        color: current.color,
        fontWeight: 600,
        fontSize: isSm ? 11 : 12,
        border: "1px solid rgba(0,0,0,0.01)",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transition: "all var(--t-fast)",
        "&:hover": onClick ? { 
          filter: "brightness(0.96)",
          transform: "scale(0.97)"
        } : undefined,
        "&:active": onClick ? {
          transform: "scale(0.94)"
        } : undefined
      }}
    >
      <Box
        sx={{
          width: isSm ? 5 : 6,
          height: isSm ? 5 : 6,
          borderRadius: "50%",
          bgcolor: current.color,
          mr: 1,
          flexShrink: 0
        }}
      />
      {current.label}
    </Box>
  );
}
