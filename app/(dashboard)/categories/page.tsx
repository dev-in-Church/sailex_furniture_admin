"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  product_count: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("adminToken") || "";
      const data = await getCategories(token);
      setCategories(data.categories || data.all || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("adminToken") || "";

      if (editingCategory) {
        await updateCategory(token, editingCategory.id, formData);
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id ? { ...c, ...formData } : c,
          ),
        );
      } else {
        const result = await createCategory(token, formData);
        setCategories([
          ...categories,
          {
            ...formData,
            id: result.category?.id || String(Date.now()),
            product_count: 0,
          },
        ]);
      }

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", slug: "", description: "" });
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const token = localStorage.getItem("adminToken") || "";
      await deleteCategory(token, id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const openNewDialog = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
    setDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Categories</h1>
          <p className="text-muted-foreground">Organize your product catalog</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Living Room"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="slug" className="text-sm font-medium">
                    URL Slug
                  </label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="living-room"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the category..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Products
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {category.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {category.slug}
                    </td>
                    <td className="px-4 py-3">
                      {category.product_count} products
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 rounded-md hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 rounded-md hover:bg-muted text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No categories found. Create your first category!
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
