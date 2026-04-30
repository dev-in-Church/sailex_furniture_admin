"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getProducts, getCategories, deleteProduct } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  category_name: string;
  category_id?: string;
  images: string[];
  is_active: boolean;
  status?: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const [productsData, categoriesData] = await Promise.all([
          getProducts(token),
          getCategories(token),
        ]);
        setProducts(productsData.products || []);
        setCategories(categoriesData.categories || categoriesData.all || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Mock data for demo
        setProducts([
          {
            id: "1",
            name: "Scandinavian Sofa",
            slug: "scandinavian-sofa",
            price: 125000,
            stock_quantity: 5,
            category_name: "Living Room",
            images: ["/images/hero-living-room.jpg"],
            is_active: true,
          },
          {
            id: "2",
            name: "Oak Dining Table",
            slug: "oak-dining-table",
            price: 89500,
            stock_quantity: 8,
            category_name: "Dining Room",
            images: ["/images/hero-living-room.jpg"],
            is_active: true,
          },
          {
            id: "3",
            name: "Velvet Armchair",
            slug: "velvet-armchair",
            price: 45000,
            stock_quantity: 12,
            category_name: "Living Room",
            images: ["/images/hero-living-room.jpg"],
            is_active: true,
          },
          {
            id: "4",
            name: "King Size Bed Frame",
            slug: "king-size-bed",
            price: 175000,
            stock_quantity: 3,
            category_name: "Bedroom",
            images: ["/images/hero-living-room.jpg"],
            is_active: true,
          },
          {
            id: "5",
            name: "Office Desk",
            slug: "office-desk",
            price: 65000,
            stock_quantity: 15,
            category_name: "Office",
            images: ["/images/hero-living-room.jpg"],
            is_active: false,
          },
        ]);
        setCategories([
          { id: "1", name: "Living Room" },
          { id: "2", name: "Bedroom" },
          { id: "3", name: "Dining Room" },
          { id: "4", name: "Office" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (token) {
        await deleteProduct(token, id);
      }
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category_name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Stock</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{product.category_name}</td>
                    <td className="p-4">{formatPrice(product.price)}</td>
                    <td className="p-4">
                      <span
                        className={
                          product.stock_quantity <= 5
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const isActive =
                          product.is_active || product.status === "active";
                        const statusText =
                          product.status || (isActive ? "active" : "draft");
                        return (
                          <span
                            className={`text-xs px-2 py-1 rounded-full capitalize ${
                              statusText === "active"
                                ? "bg-green-100 text-green-700"
                                : statusText === "draft"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {statusText}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === product.id ? null : product.id,
                            )
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {openDropdown === product.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 rounded-md border bg-popover shadow-lg z-10">
                            <Link
                              href={`/products/${product.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                            <button
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted w-full"
                              onClick={() => {
                                handleDelete(product.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No products found
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
