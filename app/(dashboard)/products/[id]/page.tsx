"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Trash2, Upload, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "@/lib/api";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

interface Category {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  images: string[];
  category_id: string;
  category_name?: string;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  status?: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<ProductData>({
    id: "",
    name: "",
    slug: "",
    description: "",
    price: 0,
    original_price: null,
    images: [],
    category_id: "",
    stock_quantity: 0,
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const [productData, categoriesData] = await Promise.all([
          getProduct(token, productId),
          getCategories(token),
        ]);

        if (productData.product) {
          setFormData({
            ...productData.product,
            category_id: productData.product.category_id || "",
            images: productData.product.images || [],
            is_active:
              productData.product.is_active ??
              productData.product.status === "active",
          });
        }
        setCategories(categoriesData.categories || categoriesData.all || []);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        alert("Product not found");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("adminToken") || "";

      // Generate slug from name if not set
      const slug =
        formData.slug ||
        formData.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      await updateProduct(token, productId, {
        ...formData,
        slug,
        original_price: formData.original_price || null,
      });

      alert("Product updated successfully!");
      router.push("/products");
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      await deleteProduct(token, productId);
      alert("Product deleted successfully!");
      router.push("/products");
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      // Fallback to URL prompt
      const url = prompt(
        "Cloudinary not configured. Enter image URL manually:",
      );
      if (url) {
        setFormData({ ...formData, images: [...formData.images, url] });
      }
      return;
    }

    setUploading(true);
    try {
      const newImages = [...formData.images];
      for (const file of Array.from(files)) {
        const result = await uploadToCloudinary(file);
        newImages.push(result.secure_url);
      }
      setFormData({ ...formData, images: newImages });
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
            <p className="text-muted-foreground">Update product details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{formData.name}"? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Scandinavian Leather Sofa"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="auto-generated-from-name"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate from name
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your product..."
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                  >
                    <Image
                      src={image}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                <label
                  className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {uploading ? (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="text-xs">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">Add Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Click "Add Image" to add an image URL. First image will be the
                main product image.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (KES) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Compare at Price (KES)
                </label>
                <Input
                  type="number"
                  value={formData.original_price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      original_price: parseFloat(e.target.value) || null,
                    })
                  }
                  placeholder="0"
                  min="0"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">
                  Original price to show discount
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Quantity *</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                  required
                />
                {formData.stock_quantity <= 5 &&
                  formData.stock_quantity > 0 && (
                    <p className="text-xs text-yellow-600">Low stock warning</p>
                  )}
                {formData.stock_quantity === 0 && (
                  <p className="text-xs text-red-600">Out of stock</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Status</label>
                <select
                  value={formData.is_active ? "active" : "draft"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === "active",
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Featured Product</label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      is_featured: !formData.is_featured,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_featured ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_featured ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {formData.images[0] ? (
                    <Image
                      src={formData.images[0]}
                      alt={formData.name || "Product preview"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate">
                    {formData.name || "Product Name"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.price
                      ? `KES ${formData.price.toLocaleString()}`
                      : "KES 0"}
                    {formData.original_price && (
                      <span className="ml-2 line-through text-xs">
                        KES {formData.original_price.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
