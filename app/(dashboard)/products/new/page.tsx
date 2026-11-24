"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProductForm } from "@/components/products/product-form";
import { useCategories } from "@/lib/use-categories";

export default function NewProductPage() {
  const { categories, loading, error, reload } = useCategories();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="We couldn't load the categories"
        description={error}
        action={
          <Button variant="outline" onClick={() => void reload()}>
            Try again
          </Button>
        }
      />
    );
  }

  return <ProductForm mode="create" categories={categories} />;
}
