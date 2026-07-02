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
      PENDING: {
        label: "Pending",
        color: "#ff9500",
        bgcolor: "rgba(255, 149, 0, 0.08)",
      },
      CONFIRMED: {
        label: "Confirmed",
        color: "#0071e3",
        bgcolor: "rgba(0, 113, 227, 0.08)",
      },
      SHIPPED: {
        label: "Shipped",
        color: "#af52de",
        bgcolor: "rgba(175, 82, 222, 0.08)",
      },
      DELIVERED: {
        label: "Delivered",
        color: "#34c759",
        bgcolor: "rgba(52, 199, 89, 0.08)",
      },
      CANCELLED: {
        label: "Cancelled",
        color: "#ff3b30",
        bgcolor: "rgba(255, 59, 48, 0.08)",
      },
    };

  const current = cfg[status] || {
    label: status,
    color: "#5e5e5e",
    bgcolor: "rgba(25, 25, 25, 0.04)",
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
        "&:hover": onClick
          ? {
              filter: "brightness(0.96)",
              transform: "scale(0.97)",
            }
          : undefined,
        "&:active": onClick
          ? {
              transform: "scale(0.94)",
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: isSm ? 5 : 6,
          height: isSm ? 5 : 6,
          borderRadius: "50%",
          bgcolor: current.color,
          mr: 1,
          flexShrink: 0,
        }}
      />
      {current.label}
    </Box>
  );
}
