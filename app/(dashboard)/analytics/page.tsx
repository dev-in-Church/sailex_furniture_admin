"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { getAnalytics } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("6months");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const data = await getAnalytics(token, { period });
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const stats = {
    totalRevenue: analytics?.revenue?.total || 3360000,
    revenueChange: 15.2,
    totalOrders: analytics?.orders?.total || 176,
    ordersChange: 8.5,
    avgOrderValue: analytics?.orders?.total
      ? analytics?.revenue?.total / analytics?.orders?.total
      : 19090,
    avgOrderChange: 6.1,
    conversionRate: 3.2,
    conversionChange: -0.5,
  };

  const revenueData = analytics?.revenue?.daily || [
    { date: "2024-03-08", amount: 89999 },
    { date: "2024-03-09", amount: 129999 },
    { date: "2024-03-10", amount: 84998 },
    { date: "2024-03-11", amount: 159999 },
    { date: "2024-03-12", amount: 189999 },
    { date: "2024-03-13", amount: 219999 },
    { date: "2024-03-14", amount: 199994 },
  ];

  const categoryData = analytics?.salesByCategory || [
    { category: "Living Room", sales: 450000 },
    { category: "Bedroom", sales: 320000 },
    { category: "Dining Room", sales: 180000 },
    { category: "Office", sales: 124987 },
  ];

  const topProducts = analytics?.topProducts || [
    { name: "Scandinavian Sofa", sold: 45, revenue: 5625000 },
    { name: "Oak Dining Table", sold: 38, revenue: 3401000 },
    { name: "Velvet Armchair", sold: 32, revenue: 1440000 },
    { name: "King Size Bed Frame", sold: 28, revenue: 4900000 },
    { name: "Office Desk", sold: 25, revenue: 1625000 },
  ];

  const maxRevenue = Math.max(...revenueData.map((d: any) => d.amount));
  const totalCategorySales = categoryData.reduce(
    (acc: number, c: any) => acc + c.sales,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Analytics</h1>
          <p className="text-muted-foreground">Track your store performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="3months">Last 3 months</option>
          <option value="6months">Last 6 months</option>
          <option value="1year">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div
                className={`flex items-center text-sm ${stats.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.revenueChange)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">
                {formatPrice(stats.totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div
                className={`flex items-center text-sm ${stats.ordersChange >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.ordersChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.ordersChange)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-100">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div
                className={`flex items-center text-sm ${stats.avgOrderChange >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.avgOrderChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.avgOrderChange)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">
                {formatPrice(stats.avgOrderValue)}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-100">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div
                className={`flex items-center text-sm ${stats.conversionChange >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.conversionChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stats.conversionChange)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{stats.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart - Simple Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {revenueData.map((day: any, index: number) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-primary rounded-t-md transition-all hover:bg-primary/80"
                    style={{ height: `${(day.amount / maxRevenue) * 100}%` }}
                    title={formatPrice(day.amount)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Product category distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category: any, index: number) => {
                const percentage = Math.round(
                  (category.sales / totalCategorySales) * 100,
                );
                const colors = [
                  "bg-amber-800",
                  "bg-amber-600",
                  "bg-amber-500",
                  "bg-amber-400",
                  "bg-amber-300",
                ];
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {category.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sold} sales
                      </p>
                    </div>
                  </div>
                  <span className="font-medium">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
