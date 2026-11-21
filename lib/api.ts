import type {
  AdminUser,
  Category,
  CategoryInput,
  Customer,
  DashboardResponse,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  Pagination,
  Product,
  ProductCounts,
  ProductInput,
} from "@/types/api";
import type { DashboardStats } from "@/types/dashboard";
import { expireSession } from "@/lib/session";

// No fallback on purpose: a missing value should fail loudly instead of
// quietly pointing a local admin at the live shop's database.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Render's free tier can take a while to wake up
const REQUEST_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  token?: string;
  body?: unknown;
};

async function request<T>(
  endpoint: string,
  { token, body, ...init }: RequestOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not set", 0);
  }

  const headers = new Headers(init.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(
      timedOut
        ? "The server took too long to respond. Please try again."
        : "Can't reach the server. Check your connection and try again.",
      0,
    );
  }

  // A protected call was rejected: the session is over (expired, revoked or tampered with)
  if (response.status === 401 && token) expireSession();

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.error || `Request failed (${response.status})`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

/** "?a=1&b=2", skipping empty values. Returns "" when nothing is left. */
function toQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/* ------------------------------ field mapping ------------------------------ */

// The product and category forms were written with snake_case names. Both
// spellings are accepted here and converted to what the server expects.
// Only fields that are actually present are sent, so an update can never
// silently reset something the form didn't touch.
type LegacyProductFields = {
  original_price?: number | string | null;
  compare_at_price?: number | string | null;
  stock_quantity?: number | string;
  category_id?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
};
export type ProductFormData = ProductInput & LegacyProductFields;

type LegacyCategoryFields = {
  image_url?: string | null;
  parent_id?: string | null;
  sort_order?: number | string;
};
export type CategoryFormData = CategoryInput & LegacyCategoryFields;

const emptyToNull = <T,>(value: T | "" | undefined) =>
  value === "" || value === undefined ? null : value;

function toServerProduct(data: ProductFormData): ProductInput {
  const out: ProductInput = {};

  if (data.name !== undefined) out.name = data.name;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.description !== undefined) out.description = data.description;
  if (data.sku !== undefined) out.sku = data.sku;
  if (data.price !== undefined) out.price = data.price;
  if (data.images !== undefined) out.images = data.images;
  if (data.specifications !== undefined) out.specifications = data.specifications;

  const compareAt = data.compareAtPrice ?? data.original_price ?? data.compare_at_price;
  const hasCompareAt =
    data.compareAtPrice !== undefined ||
    data.original_price !== undefined ||
    data.compare_at_price !== undefined;
  if (hasCompareAt) out.compareAtPrice = emptyToNull(compareAt);

  const stock = data.stockQuantity ?? data.stock_quantity;
  if (stock !== undefined) out.stockQuantity = stock;

  const hasCategory = data.categoryId !== undefined || data.category_id !== undefined;
  if (hasCategory) out.categoryId = emptyToNull(data.categoryId ?? data.category_id);

  const featured = data.featured ?? data.is_featured;
  if (featured !== undefined) out.featured = featured;

  if (data.status !== undefined) out.status = data.status;
  else if (data.is_active !== undefined) out.status = data.is_active ? "active" : "draft";

  return out;
}

function toServerCategory(data: CategoryFormData): CategoryInput {
  const out: CategoryInput = {};

  if (data.name !== undefined) out.name = data.name;
  if (data.slug !== undefined) out.slug = data.slug;
  if (data.description !== undefined) out.description = data.description;

  const imageUrl = data.imageUrl ?? data.image_url;
  if (data.imageUrl !== undefined || data.image_url !== undefined) {
    out.imageUrl = emptyToNull(imageUrl);
  }

  const parentId = data.parentId ?? data.parent_id;
  if (data.parentId !== undefined || data.parent_id !== undefined) {
    out.parentId = emptyToNull(parentId);
  }

  const sortOrder = data.sortOrder ?? data.sort_order;
  if (sortOrder !== undefined) out.sortOrder = sortOrder;

  return out;
}

/* ---------------------------------- auth ---------------------------------- */

export const adminLogin = (email: string, password: string) =>
  request<{ user: AdminUser; token: string; expiresAt?: string }>(
    "/auth/admin/login",
    { method: "POST", body: { email, password } },
  );

/* -------------------------------- dashboard ------------------------------- */

export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  const data = await request<DashboardResponse>("/admin/dashboard", { token });

  const { total, ...byStatus } = data.orders;

  return {
    totalRevenue: data.revenue,
    totalOrders: total,
    totalProducts: data.products.total,
    totalCustomers: data.customers,
    revenueChange: data.revenueChange,
    ordersChange: data.ordersChange,
    ordersByStatus: byStatus,
    lowStockCount: data.products.lowStock,
    outOfStockCount: data.products.outOfStock,
    recentOrders: data.recentOrders.map((order) => ({
      ...order,
      total: Number(order.total),
    })),
    lowStockProducts: data.lowStockProducts,
    revenueByDay: data.revenueByDay.map((day) => ({
      date: day.date,
      revenue: Number(day.revenue),
      orders: day.orders,
    })),
    topProducts: data.topProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      images: product.images ?? [],
      totalSold: product.total_sold,
      revenue: Number(product.revenue),
    })),
  };
};

/* -------------------------------- products -------------------------------- */

export const getProducts = (token: string, params?: QueryParams) =>
  request<{ products: Product[]; pagination: Pagination; counts: ProductCounts }>(
    `/admin/products${toQuery(params)}`,
    { token },
  );

export const getProduct = (token: string, id: string) =>
  request<{ product: Product }>(`/admin/products/${id}`, { token });

export const createProduct = (token: string, data: ProductFormData) =>
  request<{ product: Product }>("/admin/products", {
    method: "POST",
    body: toServerProduct(data),
    token,
  });

export const updateProduct = (token: string, id: string, data: ProductFormData) =>
  request<{ product: Product }>(`/admin/products/${id}`, {
    method: "PUT",
    body: toServerProduct(data),
    token,
  });

/** Products that appear in past orders are archived instead; `archived` tells you which happened. */
export const deleteProduct = (token: string, id: string) =>
  request<{ message: string; archived: boolean }>(`/admin/products/${id}`, {
    method: "DELETE",
    token,
  });

/* ------------------------------- categories ------------------------------- */

export const getCategories = async (token: string) => {
  const { categories } = await request<{ categories: Category[] }>(
    "/admin/categories",
    { token },
  );
  // `all` is kept so code written for the public endpoint keeps working
  return { categories, all: categories };
};

export const createCategory = (token: string, data: CategoryFormData) =>
  request<{ category: Category }>("/admin/categories", {
    method: "POST",
    body: toServerCategory(data),
    token,
  });

export const updateCategory = (token: string, id: string, data: CategoryFormData) =>
  request<{ category: Category }>(`/admin/categories/${id}`, {
    method: "PUT",
    body: toServerCategory(data),
    token,
  });

export const deleteCategory = (token: string, id: string) =>
  request<{ message: string }>(`/admin/categories/${id}`, {
    method: "DELETE",
    token,
  });

/* --------------------------------- orders --------------------------------- */

export const getOrders = (token: string, params?: QueryParams) =>
  request<{ orders: OrderSummary[]; pagination: Pagination }>(
    `/admin/orders${toQuery(params)}`,
    { token },
  );

export const getOrder = (token: string, id: string) =>
  request<{ order: OrderDetail }>(`/admin/orders/${id}`, { token });

/**
 * `force` moves an unpaid order forward anyway (for a payment received outside
 * the system). Cancelling restores the stock automatically.
 */
export const updateOrderStatus = (
  token: string,
  orderId: string,
  status: OrderStatus,
  options: { force?: boolean } = {},
) =>
  request<{ order: OrderDetail }>(`/admin/orders/${orderId}/status`, {
    method: "PUT",
    body: { status, force: options.force === true },
    token,
  });

/** After a cancelled, paid order has been refunded outside the system. */
export const markOrderRefunded = (token: string, orderId: string) =>
  request<{ order: OrderDetail }>(`/admin/orders/${orderId}/refunded`, {
    method: "POST",
    token,
  });

/* -------------------------------- customers ------------------------------- */

export const getCustomers = (token: string, params?: QueryParams) =>
  request<{ customers: Customer[]; pagination: Pagination }>(
    `/admin/customers${toQuery(params)}`,
    { token },
  );

/* -------------------------------- inventory ------------------------------- */

export const getInventory = (token: string, params?: QueryParams) =>
  request<{
    products: Array<
      Pick<Product, "id" | "name" | "slug" | "sku" | "stock_quantity" | "images">
    >;
  }>(`/admin/inventory${toQuery(params)}`, { token });

export const updateStock = (token: string, id: string, stockQuantity: number) =>
  request<{ product: Pick<Product, "id" | "name" | "stock_quantity"> }>(
    `/admin/inventory/${id}`,
    { method: "PUT", body: { stockQuantity }, token },
  );

/* -------------------------------- analytics ------------------------------- */

// The server has no /admin/analytics route yet; it's added together with the
// Analytics page so the response shape and the page are built to match.
export const getAnalytics = (token: string, params?: QueryParams) =>
  request<any>(`/admin/analytics${toQuery(params)}`, { token });
