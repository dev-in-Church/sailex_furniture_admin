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
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { PRODUCT_STATUS_TONE, StatusBadge } from "@/components/status-badge";
import { deleteProduct, getCategories, getProducts } from "@/lib/api";
import { getToken } from "@/lib/session";
import { cn, formatPrice } from "@/lib/utils";
import type { Category, Pagination as PaginationInfo, Product, ProductCounts } from "@/types/api";

const PAGE_SIZE = 20; // at most 20 products per page
const LOW_STOCK_THRESHOLD = 5; // same rule the server uses for "low stock"
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL;

const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "stock-asc", label: "Stock: lowest first" },
];

const fieldClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50";

/* ------------------------------ small pieces ------------------------------ */

function Thumb({ src, className }: { src?: string; className?: string }) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) return <StatusBadge tone="red">Out of stock</StatusBadge>;
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return <StatusBadge tone="amber">{quantity} left</StatusBadge>;
  }
  return <span className="text-sm tabular-nums text-foreground">{quantity}</span>;
}

function Price({ product }: { product: Product }) {
  const hasCompareAt = Number(product.compare_at_price) > Number(product.price);
  return (
    <div>
      <p className="font-medium tabular-nums">{formatPrice(product.price)}</p>
      {hasCompareAt && (
        <p className="text-xs tabular-nums text-muted-foreground line-through">
          {formatPrice(product.compare_at_price as string)}
        </p>
      )}
    </div>
  );
}

function RowActions({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (product: Product) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {STORE_URL && product.status === "active" && (
        <Button variant="ghost" size="icon" asChild title="View on store">
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
      <Button variant="ghost" size="icon" asChild title="Edit">
        <Link href={`/products/${product.id}`} aria-label={`Edit ${product.name}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Delete"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => onDelete(product)}
        aria-label={`Delete ${product.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function NameBlock({ product }: { product: Product }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 font-medium">
        <Link href={`/products/${product.id}`} className="truncate hover:underline">
          {product.name}
        </Link>
        {product.featured && (
          <Star
            className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
            aria-label="Featured"
          />
        )}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground">
        {product.sku ? `${product.sku} · ` : ""}
        {product.slug}
      </p>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

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
  const sort = searchParams.get("sort") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const lastPushedSearch = useRef(urlSearch);

  const [data, setData] = useState<{
    products: Product[];
    pagination: PaginationInfo;
    counts: ProductCounts;
  } | null>(null);
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
        /* the filter stays empty; the product list shows its own error */
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
      sort,
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
  }, [page, urlSearch, category, status, sort, lowStock, reloadKey]);

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

  const askDelete = (product: Product) => {
    setDeleteError(null);
    setToDelete(product);
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

  const counts = data?.counts;
  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const showSkeleton = loading && !data;

  const tabs = [
    { key: "all", label: "All", count: counts?.total, apply: { status: null, lowStock: null } },
    { key: "active", label: "Active", count: counts?.active, apply: { status: "active", lowStock: null } },
    { key: "draft", label: "Draft", count: counts?.draft, apply: { status: "draft", lowStock: null } },
    { key: "archived", label: "Archived", count: counts?.archived, apply: { status: "archived", lowStock: null } },
    { key: "low", label: "Low stock", count: counts?.lowStock, apply: { status: null, lowStock: "true" } },
  ];
  const activeTab = lowStock ? "low" : status || "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your catalog, prices and stock levels."
        actions={
          <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Link>
          </Button>
        }
      />

      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
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

      {/* Status tabs */}
      <div
        className="flex gap-1 overflow-x-auto rounded-xl bg-muted/70 p-1"
        role="group"
        aria-label="Filter by status"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={active}
              onClick={() => updateParams({ ...tab.apply, page: null })}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs tabular-nums",
                    active
                      ? tab.key === "low" && tab.count > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-muted text-foreground"
                      : "bg-background/70 text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search products by name, SKU or slug"
              placeholder="Search by name, SKU or slug..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-10 rounded-lg bg-background pl-10"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => updateParams({ category: event.target.value || null, page: null })}
            className={fieldClass}
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value || null, page: null })}
            className={fieldClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {error ? (
          <EmptyState
            icon={RefreshCw}
            title="We couldn't load your products"
            description={error}
            action={
              <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
                Try again
              </Button>
            }
          />
        ) : showSkeleton ? (
          <ul className="divide-y" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, index) => (
              <li key={index} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
                <div className="hidden h-4 w-20 animate-pulse rounded bg-muted sm:block" />
              </li>
            ))}
          </ul>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={hasFilters ? "No products match your filters" : "No products yet"}
            description={
              hasFilters
                ? "Try a different search, or clear the filters."
                : "Add your first product to start selling."
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
                  <Link href="/products/new">Add product</Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div
              className={cn("hidden overflow-x-auto md:block", loading && "opacity-60 transition-opacity")}
            >
              <table className="w-full">
                <caption className="sr-only">Products</caption>
                <thead>
                  <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-3 text-left font-medium">Product</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Category</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Price</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Stock</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={product.images?.[0]} className="h-14 w-14" />
                          <NameBlock product={product} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.category_name ? (
                          <span className="rounded-md bg-muted px-2 py-1 text-xs">
                            {product.category_name}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Price product={product} />
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge quantity={product.stock_quantity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={PRODUCT_STATUS_TONE[product.status] ?? "gray"}>
                          {product.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <RowActions product={product} onDelete={askDelete} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul
              className={cn("divide-y md:hidden", loading && "opacity-60 transition-opacity")}
              aria-label="Products"
            >
              {products.map((product) => (
                <li key={product.id} className="flex gap-3 p-4">
                  <Thumb src={product.images?.[0]} className="h-16 w-16" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <NameBlock product={product} />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={PRODUCT_STATUS_TONE[product.status] ?? "gray"}>
                        {product.status}
                      </StatusBadge>
                      <StockBadge quantity={product.stock_quantity} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Price product={product} />
                      <RowActions product={product} onDelete={askDelete} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {pagination && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                pageSize={PAGE_SIZE}
                disabled={loading}
                onPageChange={(next) => updateParams({ page: next > 1 ? String(next) : null })}
              />
            )}
          </>
        )}
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
