"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  recentOrders: any[];
  lowStockProducts: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const data = await getDashboardStats(token);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        // Use mock data for demo
        setStats({
          totalRevenue: 2547500,
          totalOrders: 156,
          totalProducts: 48,
          totalCustomers: 234,
          revenueChange: 12.5,
          ordersChange: 8.3,
          recentOrders: [
            {
              id: 1,
              order_number: "ORD-001",
              customer_name: "John Doe",
              total: 125000,
              status: "pending",
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              order_number: "ORD-002",
              customer_name: "Jane Smith",
              total: 89500,
              status: "processing",
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              order_number: "ORD-003",
              customer_name: "Mike Johnson",
              total: 245000,
              status: "shipped",
              created_at: new Date().toISOString(),
            },
          ],
          lowStockProducts: [
            { id: 1, name: "Scandinavian Sofa", stock: 2 },
            { id: 2, name: "Oak Dining Table", stock: 3 },
            { id: 3, name: "Velvet Armchair", stock: 1 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatPrice(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      change: stats?.ordersChange || 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.change !== undefined && (
                  <div
                    className={`flex items-center text-sm ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {stat.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats?.recentOrders || []).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No recent orders yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats?.lowStockProducts || []).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Package className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {product.stock} left
                  </span>
                </div>
              ))}
              {(!stats?.lowStockProducts ||
                stats.lowStockProducts.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  All products are well stocked!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/products/new">
                <Package className="h-5 w-5" />
                <span>Add New Product</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/orders?status=pending">
                <Clock className="h-5 w-5" />
                <span>View Pending Orders</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/categories">
                <Package className="h-5 w-5" />
                <span>Manage Categories</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/analytics">
                <TrendingUp className="h-5 w-5" />
                <span>View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
