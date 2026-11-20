export interface DashboardOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  item_count: number;
  created_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  /** Percent change vs the previous 30 days; null when there's no earlier period to compare to */
  revenueChange: number | null;
  ordersChange: number | null;
  ordersByStatus: Record<string, number>;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: DashboardOrder[];
  lowStockProducts: Array<{ id: string; name: string; slug: string; stock: number }>;
  /** Last 30 days, one entry per day (days without sales included) */
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    slug: string;
    images: string[];
    totalSold: number;
    revenue: number;
  }>;
}
