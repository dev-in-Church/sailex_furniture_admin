"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteProduct, getCategories, getProducts } from "@/lib/api";
import { getToken } from "@/lib/session";
import { formatPrice } from "@/lib/utils";
import type { Category, Pagination, Product } from "@/types/api";

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 5; // matches the server's dashboard and "low stock" filter
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-yellow-100 text-yellow-700",
};

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth, so filters survive refreshes and dashboard links work
  const pageParam = Number.parseInt(searchParams.get("page") ?? "", 10);
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const urlSearch = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const lastPushedSearch = useRef(urlSearch);

  const [data, setData] = useState<{ products: Product[]; pagination: Pagination } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

  // Search as you type, but only ask the server once typing pauses
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === urlSearch) return;

    const timer = setTimeout(() => {
      lastPushedSearch.current = trimmed;
      updateParams({ search: trimmed || null, page: null });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateParams]);

  // Back/forward buttons change the URL from outside: keep the box in step
  useEffect(() => {
    if (urlSearch !== lastPushedSearch.current) {
      lastPushedSearch.current = urlSearch;
      setSearchInput(urlSearch);
    }
  }, [urlSearch]);

  // Categories for the filter (loaded once)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getCategories(token)
      .then(({ categories: list }) => setCategories(list))
      .catch(() => {
        /* the filter just stays empty; the product list shows its own error */
      });
  }, []);

  // Products for the current filters
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getProducts(token, {
      page,
      limit: PAGE_SIZE,
      search: urlSearch,
      category,
      status,
      lowStock: lowStock || undefined,
    })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, urlSearch, category, status, lowStock, reloadKey]);

  // Opened a page past the end (e.g. after deleting the last item on it): go to the last one
  useEffect(() => {
    if (!data || data.products.length > 0) return;
    if (data.pagination.total > 0 && page > 1) {
      updateParams({ page: String(data.pagination.totalPages) });
    }
  }, [data, page, updateParams]);

  // Success messages disappear on their own
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const confirmDelete = async () => {
    const token = getToken();
    if (!token || !toDelete) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteProduct(token, toDelete.id);
      setNotice(result.message);
      setToDelete(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete the product");
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(urlSearch || category || status || lowStock);
  const clearFilters = () => {
    lastPushedSearch.current = "";
    setSearchInput("");
    router.replace(pathname);
  };

  const categoryOptions = categories
    .map((c) => ({ id: c.id, label: c.parent_name ? `${c.parent_name} › ${c.name}` : c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground">
            {pagination
              ? `${pagination.total} ${pagination.total === 1 ? "product" : "products"}${hasFilters ? " match your filters" : ""}`
              : "Manage your product catalog"}
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="shrink-0 text-green-800/70 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search products by name, SKU or slug"
                placeholder="Search by name, SKU or slug..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="pl-10"
              />
            </div>

            <select
              aria-label="Filter by category"
              value={category}
              onChange={(event) => updateParams({ category: event.target.value || null, page: null })}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => updateParams({ status: event.target.value || null, page: null })}
              className={selectClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(event) =>
                  updateParams({ lowStock: event.target.checked ? "true" : null, page: null })
                }
                className="h-4 w-4"
              />
              Low stock only
            </label>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          {error ? (
            <div className="space-y-3 py-10 text-center">
              <p className="font-medium">We couldn&apos;t load your products</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[760px]">
                <caption className="sr-only">Products</caption>
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="p-4 text-left font-medium">Product</th>
                    <th scope="col" className="p-4 text-left font-medium">Category</th>
                    <th scope="col" className="p-4 text-left font-medium">Price</th>
                    <th scope="col" className="p-4 text-left font-medium">Stock</th>
                    <th scope="col" className="p-4 text-left font-medium">Status</th>
                    <th scope="col" className="p-4 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index} className="border-t">
                          <td colSpan={6} className="p-4">
                            <div className="h-12 animate-pulse rounded-lg bg-muted" />
                          </td>
                        </tr>
                      ))
                    : products.map((product) => {
                        const outOfStock = product.stock_quantity <= 0;
                        const lowOnStock = !outOfStock && product.stock_quantity <= LOW_STOCK_THRESHOLD;
                        const hasCompareAt = Number(product.compare_at_price) > Number(product.price);

                        return (
                          <tr
                            key={product.id}
                            className={`border-t ${loading ? "opacity-60" : ""}`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {product.images?.[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={product.images[0]}
                                      alt=""
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="flex items-center gap-1.5 font-medium">
                                    <Link
                                      href={`/products/${product.id}`}
                                      className="truncate hover:underline"
                                    >
                                      {product.name}
                                    </Link>
                                    {product.featured && (
                                      <Star
                                        className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                                        aria-label="Featured"
                                      />
                                    )}
                                  </p>
                                  <p className="truncate text-sm text-muted-foreground">
                                    {product.sku ? `${product.sku} · ` : ""}
                                    {product.slug}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 text-sm">
                              {product.category_name ?? (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </td>

                            <td className="p-4">
                              <p className="font-medium">{formatPrice(product.price)}</p>
                              {hasCompareAt && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatPrice(product.compare_at_price as string)}
                                </p>
                              )}
                            </td>

                            <td className="p-4">
                              <span
                                className={
                                  outOfStock
                                    ? "font-medium text-red-600"
                                    : lowOnStock
                                      ? "font-medium text-amber-600"
                                      : ""
                                }
                              >
                                {outOfStock ? "Out of stock" : product.stock_quantity}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs capitalize ${STATUS_STYLES[product.status] ?? "bg-muted"}`}
                              >
                                {product.status}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex justify-end gap-1">
                                {STORE_URL && product.status === "active" && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <a
                                      href={`${STORE_URL}/products/${product.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`View ${product.name} on the store`}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" asChild>
                                  <Link
                                    href={`/products/${product.id}`}
                                    aria-label={`Edit ${product.name}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setToDelete(product);
                                  }}
                                  aria-label={`Delete ${product.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                  {!loading && products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <p className="font-medium">
                          {hasFilters ? "No products match your filters" : "No products yet"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {hasFilters
                            ? "Try a different search or clear the filters."
                            : "Add your first product to get started."}
                        </p>
                        <div className="mt-4">
                          {hasFilters ? (
                            <Button variant="outline" onClick={clearFilters}>
                              Clear filters
                            </Button>
                          ) : (
                            <Button asChild>
                              <Link href="/products/new">Add Product</Link>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && !error && (
            <div className="flex items-center justify-between gap-3 pt-4 max-sm:px-4 max-sm:pb-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => updateParams({ page: page > 2 ? String(page - 1) : null })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete product"
        description={
          <>
            Delete <span className="font-medium text-foreground">{toDelete?.name}</span>? If it
            appears in past orders it will be archived instead, so order history stays intact.
          </>
        }
        confirmLabel="Delete"
        destructive
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
