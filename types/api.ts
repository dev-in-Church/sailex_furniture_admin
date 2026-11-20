/**
 * Shapes returned by the Express admin API (routes/admin.js).
 * Money columns arrive from Postgres as strings (e.g. "89999.00"); counts are numbers.
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "admin" | "customer";
}

/* -------------------------------- products -------------------------------- */

export type ProductStatus = "active" | "draft" | "archived";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  stock_quantity: number;
  category_id: string | null;
  category_name?: string | null;
  images: string[];
  specifications: Record<string, string>;
  featured: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

/** What the server accepts. Send only the fields you want to change; null clears optional ones. */
export interface ProductInput {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number | string;
  compareAtPrice?: number | string | null;
  sku?: string | null;
  stockQuantity?: number | string;
  categoryId?: string | null;
  images?: string[];
  specifications?: Record<string, string>;
  featured?: boolean;
  status?: ProductStatus;
}

/* ------------------------------- categories ------------------------------- */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  parent_name: string | null;
  sort_order: number;
  product_count: number;
  children_count: number;
  created_at: string;
}

export interface CategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number | string;
}

/* --------------------------------- orders --------------------------------- */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  country?: string;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  email: string;
  phone: string | null;
  customer_name: string;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  total: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: "mpesa" | "stripe" | null;
  item_count: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string | null;
  name: string;
  price: string;
  quantity: number;
  slug: string | null;
  images: string[] | null;
}

export interface Payment {
  id: string;
  method: "mpesa" | "stripe";
  transaction_id: string | null;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OrderDetail extends Omit<OrderSummary, "item_count"> {
  shipping_address: ShippingAddress;
  billing_address: ShippingAddress | null;
  notes: string | null;
  customer_email: string | null;
  items: OrderItem[];
  payments: Payment[];
}

/* -------------------------------- customers ------------------------------- */

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: string;
  last_order_at: string | null;
}

/* -------------------------------- dashboard ------------------------------- */

export interface DashboardResponse {
  revenue: number;
  /** Percent change vs the previous 30 days, or null when there's nothing to compare to */
  revenueChange: number | null;
  ordersChange: number | null;
  orders: Record<string, number> & { total: number };
  products: { total: number; lowStock: number; outOfStock: number };
  customers: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: "mpesa" | "stripe" | null;
    created_at: string;
    customer_name: string;
    item_count: number;
  }>;
  revenueByDay: Array<{ date: string; revenue: string; orders: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    slug: string;
    images: string[];
    total_sold: number;
    revenue: string;
  }>;
  lowStockProducts: Array<{ id: string; name: string; slug: string; stock: number }>;
}
