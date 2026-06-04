/**
 * notify.ts — centralized toast wrapper around react-hot-toast.
 *
 * Rule: every user-facing action (success, error, warning) goes through here.
 * Never call toast() directly in page components — always use notify.*
 * This keeps toast styling consistent and makes it trivial to swap libraries later.
 */
import toast from 'react-hot-toast';

const DARK_BASE = {
  background: '#1a2235',
  color: '#f1f5f9',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  fontSize: '13.5px',
  fontWeight: '500',
  fontFamily: '"Inter", system-ui, sans-serif',
  padding: '11px 15px',
  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  maxWidth: '360px',
};

const withBorder = (color: string) => ({ ...DARK_BASE, borderLeft: `3px solid ${color}` });

const notify = {
  success(msg: string) {
    return toast.success(msg, {
      duration: 3000,
      style: withBorder('#10b981'),
      iconTheme: { primary: '#10b981', secondary: '#0d1421' },
    });
  },

  error(msg: string) {
    return toast.error(msg, {
      duration: 4500,
      style: withBorder('#ef4444'),
      iconTheme: { primary: '#ef4444', secondary: '#0d1421' },
    });
  },

  warning(msg: string) {
    return toast(msg, {
      duration: 3500,
      icon: '⚠️',
      style: withBorder('#f59e0b'),
    });
  },

  info(msg: string) {
    return toast(msg, {
      duration: 3000,
      icon: 'ℹ️',
      style: withBorder('#3b82f6'),
    });
  },

  loading(msg: string) {
    return toast.loading(msg, {
      style: withBorder('#6366f1'),
    });
  },

  dismiss(id?: string) {
    toast.dismiss(id);
  },

  /** Wrap an async call: shows loading → auto resolves to success/error */
  promise<T>(
    prom: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) {
    return toast.promise(prom, msgs, {
      style: DARK_BASE,
      loading: { style: withBorder('#6366f1') },
      success: { style: withBorder('#10b981'), iconTheme: { primary: '#10b981', secondary: '#0d1421' } },
      error:   { style: withBorder('#ef4444'), iconTheme: { primary: '#ef4444', secondary: '#0d1421' } },
    } as any);
  },

  /** Specific notification after an order status change */
  orderStatus(orderId: number, status: string) {
    const cfg: Record<string, { icon: string; color: string; msg: string }> = {
      CONFIRMED: { icon: '✅', color: '#10b981', msg: `Order #${orderId} confirmed` },
      CANCELLED: { icon: '❌', color: '#ef4444', msg: `Order #${orderId} cancelled` },
      SHIPPED:   { icon: '🚚', color: '#8b5cf6', msg: `Order #${orderId} shipped` },
      DELIVERED: { icon: '📦', color: '#06b6d4', msg: `Order #${orderId} delivered` },
      PENDING:   { icon: '⏳', color: '#f59e0b', msg: `Order #${orderId} set to pending` },
    };
    const c = cfg[status] ?? { icon: '📋', color: '#6366f1', msg: `Order #${orderId} updated` };
    return toast(c.msg, {
      icon: c.icon,
      duration: 3500,
      style: withBorder(c.color),
    });
  },

  /** Coupon applied feedback */
  couponApplied(code: string, saving: string) {
    return toast(`Coupon ${code} applied — saving ${saving}`, {
      icon: '🎉',
      duration: 4000,
      style: withBorder('#6366f1'),
    });
  },

  /** Cart action feedback */
  cart(productName: string, action: 'added' | 'removed') {
    return toast(
      action === 'added' ? `Added ${productName} to cart` : `Removed ${productName}`,
      {
        icon: action === 'added' ? '🛒' : '🗑️',
        duration: 2000,
        style: withBorder('#8b5cf6'),
      }
    );
  },
};

export default notify;
