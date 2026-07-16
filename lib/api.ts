import { DashboardStats } from "@/types/dashboard";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://sailex-furniture-server.onrender.com/api";
// Mock data for when backend is unavailable
const mockProducts = [
  {
    id: "prod-1",
    name: "Luxe Leather Sofa",
    slug: "luxe-leather-sofa",
    description: "Premium 3-seater leather sofa with solid oak frame",
    price: 189999,
    original_price: 249999,
    images: ["/images/products/sofa-1.jpg"],
    category_id: "cat-1",
    category_name: "Living Room",
    stock_quantity: 12,
    is_featured: true,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "prod-2",
    name: "Modern Platform Bed",
    slug: "modern-platform-bed",
    description: "King-size platform bed with upholstered headboard",
    price: 129999,
    original_price: null,
    images: ["/images/products/bed-1.jpg"],
    category_id: "cat-2",
    category_name: "Bedroom",
    stock_quantity: 8,
    is_featured: true,
    is_active: true,
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "prod-3",
    name: "Oak Dining Table Set",
    slug: "oak-dining-table-set",
    description: "6-seater solid oak dining table with matching chairs",
    price: 159999,
    original_price: 199999,
    images: ["/images/products/dining-1.jpg"],
    category_id: "cat-3",
    category_name: "Dining Room",
    stock_quantity: 5,
    is_featured: false,
    is_active: true,
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "prod-4",
    name: "Executive Office Chair",
    slug: "executive-office-chair",
    description: "Ergonomic leather office chair with lumbar support",
    price: 49999,
    original_price: 59999,
    images: ["/images/products/chair-1.jpg"],
    category_id: "cat-4",
    category_name: "Office",
    stock_quantity: 3,
    is_featured: true,
    is_active: true,
    created_at: "2024-02-10T10:00:00Z",
  },
  {
    id: "prod-5",
    name: "Velvet Accent Chair",
    slug: "velvet-accent-chair",
    description: "Elegant velvet armchair with gold legs",
    price: 34999,
    original_price: null,
    images: ["/images/products/sofa-1.jpg"],
    category_id: "cat-1",
    category_name: "Living Room",
    stock_quantity: 15,
    is_featured: false,
    is_active: true,
    created_at: "2024-02-15T10:00:00Z",
  },
  {
    id: "prod-6",
    name: "Nightstand with Drawers",
    slug: "nightstand-with-drawers",
    description: "Modern nightstand with 2 soft-close drawers",
    price: 19999,
    original_price: 24999,
    images: ["/images/products/bed-1.jpg"],
    category_id: "cat-2",
    category_name: "Bedroom",
    stock_quantity: 0,
    is_featured: false,
    is_active: true,
    created_at: "2024-02-20T10:00:00Z",
  },
];

const mockCategories = [
  {
    id: "cat-1",
    name: "Living Room",
    slug: "living-room",
    description: "Sofas, chairs, and living room furniture",
    image_url: "/images/categories/living-room.jpg",
    product_count: 24,
    is_active: true,
  },
  {
    id: "cat-2",
    name: "Bedroom",
    slug: "bedroom",
    description: "Beds, mattresses, and bedroom sets",
    image_url: "/images/categories/bedroom.jpg",
    product_count: 18,
    is_active: true,
  },
  {
    id: "cat-3",
    name: "Dining Room",
    slug: "dining-room",
    description: "Dining tables, chairs, and sets",
    image_url: "/images/categories/dining.jpg",
    product_count: 12,
    is_active: true,
  },
  {
    id: "cat-4",
    name: "Office",
    slug: "office",
    description: "Desks, office chairs, and storage",
    image_url: "/images/categories/office.jpg",
    product_count: 15,
    is_active: true,
  },
  {
    id: "cat-5",
    name: "Outdoor",
    slug: "outdoor",
    description: "Patio and outdoor furniture",
    image_url: "/images/categories/outdoor.jpg",
    product_count: 8,
    is_active: true,
  },
];

const mockOrders = [
  {
    id: "ord-1",
    order_number: "ORD-2024-001",
    customer_name: "John Doe",
    customer_email: "john@example.com",
    status: "delivered",
    total: 219998,
    item_count: 2,
    payment_method: "mpesa",
    created_at: "2024-03-01T14:30:00Z",
  },
  {
    id: "ord-2",
    order_number: "ORD-2024-002",
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    status: "processing",
    total: 129999,
    item_count: 1,
    payment_method: "card",
    created_at: "2024-03-05T09:15:00Z",
  },
  {
    id: "ord-3",
    order_number: "ORD-2024-003",
    customer_name: "Mike Johnson",
    customer_email: "mike@example.com",
    status: "pending",
    total: 84998,
    item_count: 2,
    payment_method: "mpesa",
    created_at: "2024-03-10T16:45:00Z",
  },
  {
    id: "ord-4",
    order_number: "ORD-2024-004",
    customer_name: "Sarah Wilson",
    customer_email: "sarah@example.com",
    status: "shipped",
    total: 189999,
    item_count: 1,
    payment_method: "card",
    created_at: "2024-03-12T11:20:00Z",
  },
  {
    id: "ord-5",
    order_number: "ORD-2024-005",
    customer_name: "Guest User",
    customer_email: "guest@example.com",
    status: "pending",
    total: 49999,
    item_count: 1,
    payment_method: "mpesa",
    created_at: "2024-03-14T08:00:00Z",
  },
];

const mockCustomers = [
  {
    id: "cust-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+254712345678",
    order_count: 5,
    total_spent: 459995,
    created_at: "2024-01-10T10:00:00Z",
    last_order_at: "2024-03-01T14:30:00Z",
  },
  {
    id: "cust-2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+254723456789",
    order_count: 3,
    total_spent: 289997,
    created_at: "2024-01-15T12:00:00Z",
    last_order_at: "2024-03-05T09:15:00Z",
  },
  {
    id: "cust-3",
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+254734567890",
    order_count: 2,
    total_spent: 134998,
    created_at: "2024-02-01T09:00:00Z",
    last_order_at: "2024-03-10T16:45:00Z",
  },
  {
    id: "cust-4",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "+254745678901",
    order_count: 1,
    total_spent: 189999,
    created_at: "2024-02-20T15:00:00Z",
    last_order_at: "2024-03-12T11:20:00Z",
  },
];

const mockDashboardStats = {
  totalRevenue: 1074987,
  totalOrders: 12,
  totalCustomers: 8,
  totalProducts: 45,
  revenueGrowth: 15.5,
  orderGrowth: 22.3,
  customerGrowth: 18.7,
  recentOrders: mockOrders.slice(0, 5),
  lowStockProducts: mockProducts.filter((p) => p.stock_quantity <= 5),
  salesByCategory: [
    { category: "Living Room", sales: 450000 },
    { category: "Bedroom", sales: 320000 },
    { category: "Dining Room", sales: 180000 },
    { category: "Office", sales: 124987 },
  ],
};

// Storage for mock data mutations
let localProducts = [...mockProducts];
let localCategories = [...mockCategories];
let localOrders = [...mockOrders];

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  } catch (error) {
    // Re-throw if it's not a network error
    if (error instanceof Error && !error.message.includes("fetch")) {
      throw error;
    }
    // Return null to indicate fallback to mock data
    throw new Error("NETWORK_ERROR");
  }
}

// Auth
export const adminLogin = async (email: string, password: string) => {
  try {
    return await fetchAPI<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    // Mock login for demo
    if (email === "admin@sailex.com" && password === "admin123") {
      return {
        user: {
          id: "admin-1",
          email: "admin@sailex.com",
          name: "Admin User",
          role: "admin",
        },
        token: "mock-admin-token-" + Date.now(),
      };
    }
    throw new Error("Invalid email or password");
  }
};

// Dashboard
export const getDashboardStats = async (
  token: string,
): Promise<DashboardStats> => {
  try {
    const data = await fetchAPI<any>("/admin/dashboard", { token });
    // Map backend response to frontend expected format
    return {
      totalRevenue: data.revenue || 0,
      totalOrders: data.orders?.total || 0,
      totalProducts: data.products?.total || 0,
      totalCustomers: data.customers || 0,
      revenueChange: 12.5, // Calculate from historical data if available
      ordersChange: 8.3,
      recentOrders: (data.recentOrders || []).map((o: any) => ({
        ...o,
        order_number: o.order_number || `ORD-${o.id?.slice(0, 8)}`,
        customer_name: o.customer_name || o.shipping_name || "Guest",
        total: parseFloat(o.total) || 0,
      })),
      lowStockProducts: (data.lowStockProducts || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock ?? p.stock_quantity ?? 0,
      })),
    };
  } catch {
    return {
      totalRevenue: mockDashboardStats.totalRevenue,
      totalOrders: mockDashboardStats.totalOrders,
      totalProducts: mockDashboardStats.totalProducts,
      totalCustomers: mockDashboardStats.totalCustomers,
      revenueChange: mockDashboardStats.revenueGrowth,
      ordersChange: mockDashboardStats.orderGrowth,
      recentOrders: mockDashboardStats.recentOrders,
      lowStockProducts: mockDashboardStats.lowStockProducts,
    };
  }
};

// Products
export const getProducts = async (
  token: string,
  params?: Record<string, string>,
) => {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    // Use admin endpoint to get all products including drafts
    return await fetchAPI<{ products: any[]; pagination: any }>(
      `/admin/products${query}`,
      { token },
    );
  } catch {
    // Filter mock products based on params
    let filtered = [...localProducts];

    if (params?.category) {
      filtered = filtered.filter((p) => p.category_id === params.category);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search),
      );
    }

    return {
      products: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
    };
  }
};

export const getProduct = async (token: string, id: string) => {
  try {
    // First try to get by ID from admin endpoint
    return await fetchAPI<{ product: any }>(`/admin/products/${id}`, { token });
  } catch {
    // Fallback: try public endpoint with slug
    try {
      return await fetchAPI<{ product: any }>(`/products/${id}`, { token });
    } catch {
      const product = localProducts.find((p) => p.id === id || p.slug === id);
      if (!product) throw new Error("Product not found");
      return { product };
    }
  }
};

export const createProduct = async (token: string, data: any) => {
  try {
    // Map frontend field names to backend expected format
    const mappedData = {
      name: data.name,
      slug:
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: data.description,
      price: data.price,
      compareAtPrice: data.original_price || data.compareAtPrice,
      stockQuantity: data.stock_quantity ?? data.stockQuantity ?? 0,
      categoryId: data.category_id || data.categoryId,
      images: data.images || [],
      featured: data.is_featured ?? data.featured ?? false,
      status: data.is_active === false ? "draft" : "active",
    };

    return await fetchAPI<{ product: any }>("/admin/products", {
      method: "POST",
      body: JSON.stringify(mappedData),
      token,
    });
  } catch {
    // Mock create product
    const newProduct = {
      id: "prod-" + Date.now(),
      ...data,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      created_at: new Date().toISOString(),
      is_active: true,
      status: "active",
    };
    localProducts.unshift(newProduct);
    return { product: newProduct };
  }
};

export const updateProduct = async (token: string, id: string, data: any) => {
  try {
    // Map frontend field names to backend field names
    const mappedData = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      compareAtPrice: data.original_price || data.compareAtPrice,
      stockQuantity: data.stock_quantity ?? data.stockQuantity,
      categoryId: data.category_id || data.categoryId,
      images: data.images,
      featured: data.is_featured ?? data.featured,
      status: data.is_active === false ? "draft" : data.status || "active",
    };

    return await fetchAPI<{ product: any }>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(mappedData),
      token,
    });
  } catch {
    // Mock update product
    const index = localProducts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Product not found");
    localProducts[index] = { ...localProducts[index], ...data };
    return { product: localProducts[index] };
  }
};

export const deleteProduct = async (token: string, id: string) => {
  try {
    return await fetchAPI<{ message: string }>(`/admin/products/${id}`, {
      method: "DELETE",
      token,
    });
  } catch {
    // Mock delete product
    const index = localProducts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Product not found");
    localProducts.splice(index, 1);
    return { message: "Product deleted successfully" };
  }
};

// Categories
export const getCategories = async (token: string) => {
  try {
    return await fetchAPI<{ categories: any[]; all: any[] }>("/categories", {
      token,
    });
  } catch {
    return { categories: localCategories, all: localCategories };
  }
};

export const createCategory = async (token: string, data: any) => {
  try {
    return await fetchAPI<{ category: any }>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  } catch {
    const newCategory = {
      id: "cat-" + Date.now(),
      ...data,
      slug: data.name.toLowerCase().replace(/\s+/g, "-"),
      product_count: 0,
      is_active: true,
    };
    localCategories.push(newCategory);
    return { category: newCategory };
  }
};

export const updateCategory = async (token: string, id: string, data: any) => {
  try {
    return await fetchAPI<{ category: any }>(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
  } catch {
    const index = localCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    localCategories[index] = { ...localCategories[index], ...data };
    return { category: localCategories[index] };
  }
};

export const deleteCategory = async (token: string, id: string) => {
  try {
    return await fetchAPI<{ message: string }>(`/admin/categories/${id}`, {
      method: "DELETE",
      token,
    });
  } catch {
    const index = localCategories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    localCategories.splice(index, 1);
    return { message: "Category deleted successfully" };
  }
};

// Orders
export const getOrders = async (
  token: string,
  params?: Record<string, string>,
) => {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return await fetchAPI<{ orders: any[]; pagination: any }>(
      `/admin/orders${query}`,
      { token },
    );
  } catch {
    let filtered = [...localOrders];

    if (params?.status && params.status !== "all") {
      filtered = filtered.filter((o) => o.status === params.status);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(search) ||
          o.customer_name.toLowerCase().includes(search) ||
          o.customer_email.toLowerCase().includes(search),
      );
    }

    return {
      orders: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
    };
  }
};

export const getOrder = async (token: string, id: string) => {
  try {
    return await fetchAPI<{ order: any }>(`/admin/orders/${id}`, { token });
  } catch {
    const order = localOrders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found");
    return { order };
  }
};

export const updateOrderStatus = async (
  token: string,
  orderId: string,
  status: string,
) => {
  try {
    return await fetchAPI<any>(`/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      token,
    });
  } catch {
    const index = localOrders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error("Order not found");
    localOrders[index] = { ...localOrders[index], status };
    return { order: localOrders[index] };
  }
};

// Customers
export const getCustomers = async (
  token: string,
  params?: Record<string, string>,
) => {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return await fetchAPI<{ customers: any[]; pagination: any }>(
      `/admin/customers${query}`,
      { token },
    );
  } catch {
    let filtered = [...mockCustomers];

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search),
      );
    }

    return {
      customers: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
    };
  }
};

// Analytics
export const getAnalytics = async (
  token: string,
  params?: Record<string, string>,
) => {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return await fetchAPI<any>(`/admin/analytics${query}`, { token });
  } catch {
    return {
      revenue: {
        total: 1074987,
        daily: [
          { date: "2024-03-08", amount: 89999 },
          { date: "2024-03-09", amount: 129999 },
          { date: "2024-03-10", amount: 84998 },
          { date: "2024-03-11", amount: 159999 },
          { date: "2024-03-12", amount: 189999 },
          { date: "2024-03-13", amount: 219999 },
          { date: "2024-03-14", amount: 199994 },
        ],
      },
      orders: {
        total: 12,
        byStatus: {
          pending: 2,
          processing: 3,
          shipped: 4,
          delivered: 3,
        },
      },
      topProducts: mockProducts.slice(0, 5).map((p, i) => ({
        ...p,
        sold: 20 - i * 3,
        revenue: p.price * (20 - i * 3),
      })),
      salesByCategory: mockDashboardStats.salesByCategory,
    };
  }
};
