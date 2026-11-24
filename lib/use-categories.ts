"use client";

import { useCallback, useEffect, useState } from "react";
import { getCategories } from "@/lib/api";
import { getToken } from "@/lib/session";
import type { Category } from "@/types/api";

/** Loads every category (including subcategories) for dropdowns. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return; // the layout sends signed-out visitors to the login page

    setLoading(true);
    setError(null);
    try {
      const result = await getCategories(token);
      setCategories(result.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { categories, loading, error, reload: load };
}
