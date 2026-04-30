"use client";

import { useEffect, useState } from "react";
import { Search, User, ShoppingBag, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCustomers } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  order_count: number;
  total_spent: number;
  created_at: string;
  last_order_at: string | null;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const params: Record<string, string> = {};
        if (search) params.search = search;

        const data = await getCustomers(token, params);
        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search]);

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((acc, c) => acc + c.total_spent, 0);
  const totalOrders = customers.reduce((acc, c) => acc + c.order_count, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
        <h1 className="text-2xl font-serif font-semibold">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {formatPrice(totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {formatPrice(avgOrderValue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg. Order Value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Total Spent
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">{customer.order_count}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.last_order_at
                        ? formatDate(customer.last_order_at)
                        : "-"}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No customers found
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
