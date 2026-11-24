"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PackageX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProductForm } from "@/components/products/product-form";
import { ApiError, getProduct } from "@/lib/api";
import { getToken } from "@/lib/session";
import { useCategories } from "@/lib/use-categories";
import type { Product } from "@/types/api";

function Spinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set when we arrive straight after creating a product
  const [justCreated] = useState(() => searchParams.get("created") === "1");

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    reload: reloadCategories,
  } = useCategories();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return; // the layout sends signed-out visitors to the login page

    setLoading(true);
    setError(null);
    try {
      const result = await getProduct(token, id);
      setProduct(result.product);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Couldn't load the product",
        notFound: err instanceof ApiError && err.status === 404,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Drop ?created=1 so refreshing the page doesn't show the banner again
  useEffect(() => {
    if (justCreated) router.replace(`/products/${id}`, { scroll: false });
  }, [justCreated, id, router]);

  if (loading || categoriesLoading) return <Spinner />;

  if (error) {
    return (
      <EmptyState
        icon={error.notFound ? PackageX : RefreshCw}
        title={error.notFound ? "Product not found" : "We couldn't load this product"}
        description={
          error.notFound
            ? "It may have been deleted, or the link is wrong."
            : error.message
        }
        action={
          error.notFound ? (
            <Button asChild variant="outline">
              <Link href="/products">Back to products</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          )
        }
      />
    );
  }

  if (categoriesError) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="We couldn't load the categories"
        description={categoriesError}
        action={
          <Button variant="outline" onClick={() => void reloadCategories()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (!product) return null;

  return (
    <ProductForm
      key={product.id}
      mode="edit"
      product={product}
      categories={categories}
      initialNotice={justCreated ? "Product created. You can keep editing it here." : undefined}
    />
  );
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <EditProduct />
    </Suspense>
  );
}
