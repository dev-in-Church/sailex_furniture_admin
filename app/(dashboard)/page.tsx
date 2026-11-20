"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getDashboardStats } from "@/lib/api";
import { getToken, getUser } from "@/lib/session";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { DashboardStats } from "@/types/dashboard";

const STATUS_ORDER = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {capitalize(status)}
    </span>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">No earlier data</span>;
  }
  const positive = value >= 0;
  return (
    <span
      className={`flex items-center text-sm ${positive ? "text-green-600" : "text-red-600"}`}
    >
      {positive ? (
        <TrendingUp className="mr-1 h-4 w-4" />
      ) : (
        <TrendingDown className="mr-1 h-4 w-4" />
      )}
      {Math.abs(value)}%
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="h-16 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return; // the layout sends signed-out visitors to the login page

    setLoading(true);
    setError(null);
    try {
      setStats(await getDashboardStats(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFirstName(getUser()?.name?.split(" ")[0] ?? "");
    void load();
  }, [load]);

  if (loading && !stats) return <DashboardSkeleton />;

  if (error && !stats) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 p-8 text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">We couldn&apos;t load the dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={() => void load()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const toProcess = stats.ordersByStatus.confirmed ?? 0;
  const awaitingPayment = stats.ordersByStatus.pending ?? 0;

  const statCards = [
    {
      title: "Total revenue",
      value: formatPrice(stats.totalRevenue),
      caption: "Paid orders, all time",
      change: stats.revenueChange,
      showChange: true,
      icon: Wallet,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Orders",
      value: stats.totalOrders.toLocaleString("en-KE"),
      caption: "All orders placed",
      change: stats.ordersChange,
      showChange: true,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active products",
      value: stats.totalProducts.toLocaleString("en-KE"),
      caption:
        stats.lowStockCount + stats.outOfStockCount > 0
          ? `${stats.lowStockCount} low, ${stats.outOfStockCount} out of stock`
          : "All well stocked",
      showChange: false,
      change: null,
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Customers",
      value: stats.totalCustomers.toLocaleString("en-KE"),
      caption: "Registered accounts",
      showChange: false,
      change: null,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  const attention = [
    {
      label: "Orders to process",
      count: toProcess,
      href: "/orders?status=confirmed",
      active: "border-blue-300 bg-blue-50",
    },
    {
      label: "Awaiting payment",
      count: awaitingPayment,
      href: "/orders?status=pending",
      active: "border-yellow-300 bg-yellow-50",
    },
    {
      label: "Low stock",
      count: stats.lowStockCount,
      href: "/products?lowStock=true",
      active: "border-orange-300 bg-orange-50",
    },
    {
      label: "Out of stock",
      count: stats.outOfStockCount,
      href: "/products?lowStock=true",
      active: "border-red-300 bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          Couldn&apos;t refresh: {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.showChange && <Change value={stat.change} />}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.caption}
                  {stat.showChange && stat.change !== null && " · vs previous 30 days"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs attention */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {attention.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`rounded-lg border p-4 transition-colors hover:bg-muted/60 ${
              item.count > 0 ? item.active : "bg-card"
            }`}
          >
            <p className="text-2xl font-semibold">{item.count}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </Link>
        ))}
      </div>

      {/* Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Paid orders per day, last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={stats.revenueByDay} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent orders</CardTitle>
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
            {stats.recentOrders.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/orders?search=${encodeURIComponent(order.order_number)}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{order.order_number}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {order.customer_name} · {formatDateTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium">{formatPrice(order.total)}</p>
                        <div className="mt-1 flex justify-end gap-1">
                          {order.payment_status !== "paid" && (
                            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {capitalize(order.payment_status)}
                            </span>
                          )}
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Where every order currently stands</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {STATUS_ORDER.map((status) => {
                const count = stats.ordersByStatus[status] ?? 0;
                const share = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
                return (
                  <li key={status}>
                    <Link
                      href={`/orders?status=${status}`}
                      className="block rounded-lg p-2 transition-colors hover:bg-muted/60"
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <StatusBadge status={status} />
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best sellers by units sold (paid orders)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No sales yet. Paid orders will show here.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                    >
                      <span className="w-5 text-center text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0] || "/placeholder.png"}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 rounded-lg bg-muted object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalSold} sold
                        </p>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(product.revenue)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products?lowStock=true">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                All products are well stocked.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                          <Package className="h-4 w-4 text-red-600" />
                        </div>
                        <p className="truncate font-medium">{product.name}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-red-600">
                        {product.stock <= 0 ? "Out of stock" : `${product.stock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 py-4"
              asChild
            >
              <Link href="/products/new">
                <Package className="h-5 w-5" />
                <span>Add new product</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 py-4"
              asChild
            >
              <Link href="/orders?status=confirmed">
                <Clock className="h-5 w-5" />
                <span>Orders to process</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 py-4"
              asChild
            >
              <Link href="/categories">
                <Package className="h-5 w-5" />
                <span>Manage categories</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-2 py-4"
              asChild
            >
              <Link href="/analytics">
                <TrendingUp className="h-5 w-5" />
                <span>View analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
