/**
 * notify.ts — centralized toast wrapper around react-hot-toast.
 *
 * Rule: every user-facing action (success, error, warning) goes through here.
 * Never call toast() directly in page components — always use notify.*
 * This keeps toast styling consistent and makes it trivial to swap libraries later.
 */
import toast from "react-hot-toast";

const BASE_STYLE = {
  backdropFilter: "blur(20px) saturate(190%)",
  WebkitBackdropFilter: "blur(20px) saturate(190%)",
  color: "#191919",
  borderRadius: "99px",
  fontSize: "13.5px",
  fontWeight: "600",
  fontFamily: '"Anthropic", "Cohere"',
  padding: "10px 22px",
  boxShadow:
    "0 10px 30px -5px rgba(25, 25, 25, 0.08), 0 2px 8px -2px rgba(25, 25, 25, 0.02)",
  maxWidth: "420px",
};

const styleFor = (border: string, bg: string) => ({
  ...BASE_STYLE,
  border: `1px solid ${border}`,
  background: bg,
});

const notify = {
  success(msg: string) {
    return toast.success(msg, {
      duration: 3000,
      style: styleFor("rgba(21, 128, 61, 0.25)", "rgba(240, 253, 244, 0.92)"),
      iconTheme: { primary: "#15803D", secondary: "#ffffff" },
    });
  },

  error(msg: string) {
    return toast.error(msg, {
      duration: 4500,
      style: styleFor("rgba(185, 28, 28, 0.25)", "rgba(254, 242, 242, 0.92)"),
      iconTheme: { primary: "#B91C1C", secondary: "#ffffff" },
    });
  },

  warning(msg: string) {
    return toast(msg, {
      duration: 3500,
      icon: "⚠️",
      style: styleFor("rgba(180, 83, 9, 0.25)", "rgba(255, 251, 235, 0.92)"),
    });
  },

  info(msg: string) {
    return toast(msg, {
      duration: 3000,
      icon: "ℹ️",
      style: styleFor("rgba(29, 78, 216, 0.25)", "rgba(239, 246, 255, 0.92)"),
    });
  },

  loading(msg: string) {
    return toast.loading(msg, {
      style: styleFor("rgba(109, 40, 217, 0.25)", "rgba(245, 243, 255, 0.92)"),
    });
  },

  dismiss(id?: string) {
    toast.dismiss(id);
  },

  /** Wrap an async call: shows loading → auto resolves to success/error */
  promise<T>(
    prom: Promise<T>,
    msgs: { loading: string; success: string; error: string },
  ) {
    return toast.promise(prom, msgs, {
      style: styleFor("rgba(230, 228, 221, 0.8)", "rgba(255, 255, 255, 0.9)"),
      loading: {
        style: styleFor(
          "rgba(109, 40, 217, 0.25)",
          "rgba(245, 243, 255, 0.92)",
        ),
      },
      success: {
        style: styleFor("rgba(21, 128, 61, 0.25)", "rgba(240, 253, 244, 0.92)"),
        iconTheme: { primary: "#15803D", secondary: "#ffffff" },
      },
      error: {
        style: styleFor("rgba(185, 28, 28, 0.25)", "rgba(254, 242, 242, 0.92)"),
        iconTheme: { primary: "#B91C1C", secondary: "#ffffff" },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any);
  },

  /** Specific notification after an order status change */
  orderStatus(orderId: number, status: string) {
    const cfg: Record<string, { icon: string; color: string; msg: string }> = {
      CONFIRMED: {
        icon: "✅",
        color: "#15803D",
        msg: `Order #${orderId} confirmed`,
      },
      CANCELLED: {
        icon: "❌",
        color: "#B91C1C",
        msg: `Order #${orderId} cancelled`,
      },
      SHIPPED: {
        icon: "🚚",
        color: "#6d28d9",
        msg: `Order #${orderId} shipped`,
      },
      DELIVERED: {
        icon: "📦",
        color: "#1D4ED8",
        msg: `Order #${orderId} delivered`,
      },
      PENDING: {
        icon: "⏳",
        color: "#B45309",
        msg: `Order #${orderId} set to pending`,
      },
    };
    const c = cfg[status] ?? {
      icon: "📋",
      color: "#6d28d9",
      msg: `Order #${orderId} updated`,
    };

    // Map solid color to soft border/bg tints
    const getColors = (col: string) => {
      switch (col) {
        case "#15803D":
          return {
            border: "rgba(21, 128, 61, 0.25)",
            bg: "rgba(240, 253, 244, 0.92)",
          };
        case "#B91C1C":
          return {
            border: "rgba(185, 28, 28, 0.25)",
            bg: "rgba(254, 242, 242, 0.92)",
          };
        case "#B45309":
          return {
            border: "rgba(180, 83, 9, 0.25)",
            bg: "rgba(255, 251, 235, 0.92)",
          };
        case "#1D4ED8":
          return {
            border: "rgba(29, 78, 216, 0.25)",
            bg: "rgba(239, 246, 255, 0.92)",
          };
        case "#6d28d9":
        default:
          return {
            border: "rgba(109, 40, 217, 0.25)",
            bg: "rgba(245, 243, 255, 0.92)",
          };
      }
    };

    const colors = getColors(c.color);
    return toast(c.msg, {
      icon: c.icon,
      duration: 3500,
      style: styleFor(colors.border, colors.bg),
    });
  },

  /** Coupon applied feedback */
  couponApplied(code: string, saving: string) {
    return toast(`Coupon ${code} applied — saving ${saving}`, {
      icon: "🎉",
      duration: 4000,
      style: styleFor("rgba(29, 78, 216, 0.25)", "rgba(239, 246, 255, 0.92)"),
    });
  },

  /** Cart action feedback */
  cart(productName: string, action: "added" | "removed") {
    return toast(
      action === "added"
        ? `Added ${productName} to cart`
        : `Removed ${productName}`,
      {
        icon: action === "added" ? "🛒" : "🗑️",
        duration: 2000,
        style: styleFor(
          "rgba(109, 40, 217, 0.25)",
          "rgba(245, 243, 255, 0.92)",
        ),
      },
    );
  },
};

export default notify;
