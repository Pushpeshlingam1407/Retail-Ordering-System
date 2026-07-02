// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = "ADMIN" | "USER";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  token?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

// ─── Enums ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type DiscountType = "PERCENTAGE" | "FLAT";

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Brand {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category?: Category;
  brand?: Brand;
  packaging?: string;
  imageUrl?: string;
}

export interface ProductRequest {
  name: string;
  price: number;
  categoryId: number;
  brandId: number;
  packaging: string;
  imageUrl?: string;
}

export interface UploadResponse {
  url: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export interface Inventory {
  id: number;
  product: Product;
  quantity: number;
  lowStockThreshold: number;
}

export interface InventoryDTO {
  productId: number;
  quantity: number;
  lowStockThreshold?: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartDTO {
  id: number;
  userId: number;
}

export interface CartItemDTO {
  productId: number;
  quantity: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItemRequest {
  productId: number;
  quantity: number;
  priceAtTime: number;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  quantity: number;
  priceAtTime: number;
}

export interface OrderRequest {
  userId: number;
  deliveryAddress: string;
  couponCode?: string;
  status?: OrderStatus;
  items: OrderItemRequest[];
}

export interface OrderResponse {
  id: number;
  userId: number;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  couponCode?: string;
  discount?: number;
  placedAt: string;
  deliveredAt?: string;
  items: OrderItemResponse[];
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
export interface CouponRequest {
  code: string;
  type: DiscountType;
  value: number;
  expiryDate: string;
  active?: boolean;
  usageLimit?: number;
}

export interface CouponResponse {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  expiryDate: string;
  active: boolean;
  usageLimit?: number;
  usedCount: number;
}
