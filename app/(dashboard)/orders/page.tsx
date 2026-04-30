"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getOrders, updateOrderStatus } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  payment_method: string;
  item_count: number;
  created_at: string;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const params: Record<string, string> = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (search) params.search = search;

        const data = await getOrders(token, params);
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, search]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      await updateOrderStatus(token, orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
      setActiveDropdown(null);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track customer orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold">{orderStats.total}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-yellow-600">
              {orderStats.pending}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-blue-600">
              {orderStats.processing}
            </p>
            <p className="text-sm text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-purple-600">
              {orderStats.shipped}
            </p>
            <p className="text-sm text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-green-600">
              {orderStats.delivered}
            </p>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Clock;
                  return (
                    <tr key={order.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{order.item_count} items</td>
                      <td className="px-4 py-3">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 capitalize">
                        {order.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full capitalize ${statusColors[order.status]}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === order.id ? null : order.id,
                              )
                            }
                          >
                            Actions <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                          {activeDropdown === order.id && (
                            <div className="absolute right-0 mt-1 w-48 rounded-md border bg-background shadow-lg z-10">
                              <div className="py-1">
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                  onClick={() =>
                                    handleStatusUpdate(order.id, "processing")
                                  }
                                >
                                  <Package className="mr-2 h-4 w-4" /> Mark
                                  Processing
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                  onClick={() =>
                                    handleStatusUpdate(order.id, "shipped")
                                  }
                                >
                                  <Truck className="mr-2 h-4 w-4" /> Mark
                                  Shipped
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                  onClick={() =>
                                    handleStatusUpdate(order.id, "delivered")
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" /> Mark
                                  Delivered
                                </button>
                                <hr className="my-1" />
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center text-red-600"
                                  onClick={() =>
                                    handleStatusUpdate(order.id, "cancelled")
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                                  Order
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
