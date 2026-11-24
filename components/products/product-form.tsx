"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Package, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { ImageManager } from "@/components/products/image-manager";
import { createProduct, deleteProduct, updateProduct, type ProductFormData } from "@/lib/api";
import { getToken } from "@/lib/session";
import { cn, formatPrice } from "@/lib/utils";
import type { Category, Product, ProductStatus } from "@/types/api";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL;
const LOW_STOCK_THRESHOLD = 5;

// Suggested details for a new product; empty rows are dropped when saving
const PRESET_SPECS = ["Dimensions", "Material", "Color", "Weight"];

const STATUS_OPTIONS: { value: ProductStatus; label: string; hint: string }[] = [
  { value: "active", label: "Active", hint: "Visible and for sale on the store" },
  { value: "draft", label: "Draft", hint: "Hidden while you finish it" },
  { value: "archived", label: "Archived", hint: "Hidden, kept for your records" },
];

const textareaClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

/* ---------------------------------- state ---------------------------------- */

type SpecRow = { id: number; key: string; value: string };

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stockQuantity: string;
  categoryId: string;
  status: ProductStatus;
  featured: boolean;
  images: string[];
  specs: SpecRow[];
};

type Errors = Partial<Record<"name" | "slug" | "price" | "compareAtPrice" | "stockQuantity" | "categoryId", string>>;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function toFormState(product?: Product): FormState {
  const entries = Object.entries(product?.specifications ?? {});
  const rows =
    entries.length > 0
      ? entries.map(([key, value]) => ({ key, value: String(value) }))
      : PRESET_SPECS.map((key) => ({ key, value: "" }));

  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? String(Number(product.price)) : "",
    compareAtPrice: product?.compare_at_price ? String(Number(product.compare_at_price)) : "",
    sku: product?.sku ?? "",
    stockQuantity: product ? String(product.stock_quantity) : "",
    categoryId: product?.category_id ?? "",
    status: product?.status ?? "active",
    featured: product?.featured ?? false,
    images: product?.images ?? [],
    specs: rows.map((row, index) => ({ id: index, ...row })),
  };
}

// Used to tell whether anything changed since the last save
const serialize = (state: FormState) =>
  JSON.stringify({ ...state, specs: state.specs.map((row) => [row.key, row.value]) });

function validate(state: FormState): Errors {
  const errors: Errors = {};
  const price = Number(state.price);
  const hasPrice = state.price.trim() !== "" && Number.isFinite(price) && price >= 0;

  if (!state.name.trim()) errors.name = "Enter a product name";
  else if (state.name.trim().length > 200) errors.name = "Keep the name under 200 characters";

  if (!SLUG_RE.test(state.slug)) errors.slug = "Use lowercase letters, numbers and hyphens only";

  if (!hasPrice) errors.price = "Enter a valid price";

  if (state.compareAtPrice.trim() !== "") {
    const compareAt = Number(state.compareAtPrice);
    if (!Number.isFinite(compareAt) || compareAt < 0) errors.compareAtPrice = "Enter a valid price";
    else if (hasPrice && compareAt <= price) errors.compareAtPrice = "Must be higher than the price";
  }

  const stock = Number(state.stockQuantity);
  if (state.stockQuantity.trim() === "" || !Number.isInteger(stock) || stock < 0) {
    errors.stockQuantity = "Enter a whole number, 0 or more";
  }

  if (!state.categoryId) errors.categoryId = "Choose a category";

  return errors;
}

function toPayload(state: FormState): ProductFormData {
  const specifications: Record<string, string> = {};
  for (const row of state.specs) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (key && value) specifications[key] = value;
  }

  return {
    name: state.name.trim(),
    slug: state.slug.trim(),
    description: state.description.trim() || null,
    price: Number(state.price),
    compareAtPrice: state.compareAtPrice.trim() ? Number(state.compareAtPrice) : null,
    sku: state.sku.trim() || null,
    stockQuantity: Number(state.stockQuantity),
    categoryId: state.categoryId,
    images: state.images,
    specifications,
    featured: state.featured,
    status: state.status,
  };
}

/* ------------------------------ small pieces ------------------------------ */

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Preview({ state, category }: { state: FormState; category?: string }) {
  const price = Number(state.price);
  const compareAt = Number(state.compareAtPrice);
  const hasPrice = state.price.trim() !== "" && Number.isFinite(price);
  const discount =
    hasPrice && Number.isFinite(compareAt) && compareAt > price
      ? Math.round((1 - price / compareAt) * 100)
      : 0;
  const stock = Number(state.stockQuantity);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="relative aspect-square bg-muted">
        {state.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.images[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {state.stockQuantity.trim() !== "" && stock > 0 && stock <= LOW_STOCK_THRESHOLD && (
          <span className="absolute inset-x-0 bottom-0 bg-amber-100 py-1 text-center text-xs font-medium text-amber-800">
            Only {stock} left in stock
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        {category && <p className="text-xs text-muted-foreground">{category}</p>}
        <p className="line-clamp-2 min-h-[2.5rem] text-sm">{state.name || "Product name"}</p>
        <p className="font-semibold">{hasPrice ? formatPrice(price) : "KES 0"}</p>
        {discount > 0 && (
          <p className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- form ---------------------------------- */

type ProductFormProps = {
  mode: "create" | "edit";
  categories: Category[];
  product?: Product;
  /** Banner shown when the page opens, e.g. right after creating a product */
  initialNotice?: string;
};

export function ProductForm({ mode, categories, product, initialNotice }: ProductFormProps) {
  const router = useRouter();

  const [state, setState] = useState<FormState>(() => toFormState(product));
  const savedSnapshot = useRef(serialize(state));
  const nextSpecId = useRef(state.specs.length);

  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const errors = validate(state);
  const dirty = serialize(state) !== savedSnapshot.current;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleNameChange = (name: string) => {
    setState((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    setShowErrors(true);
    setFormError(null);

    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const field: Record<string, string> = {
        name: "product-name",
        slug: "product-slug",
        price: "product-price",
        compareAtPrice: "product-compare-at",
        stockQuantity: "product-stock",
        categoryId: "product-category",
      };
      document.getElementById(field[firstError])?.focus();
      return;
    }

    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const payload = toPayload(state);

      if (mode === "create") {
        const { product: created } = await createProduct(token, payload);
        savedSnapshot.current = serialize(state);
        router.push(`/products/${created.id}?created=1`);
        return;
      }

      await updateProduct(token, product!.id, payload);
      savedSnapshot.current = serialize(state);
      setShowErrors(false);
      setNotice("Changes saved.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save the product");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const token = getToken();
    if (!token || !product) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(token, product.id);
      savedSnapshot.current = serialize(state);
      router.push("/products");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete the product");
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (dirty) setConfirmDiscard(true);
    else router.push("/products");
  };

  const categoryOptions = categories
    .map((c) => ({ id: c.id, label: c.parent_name ? `${c.parent_name} › ${c.name}` : c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const categoryLabel = categoryOptions.find((option) => option.id === state.categoryId)?.label;

  const price = Number(state.price);
  const compareAt = Number(state.compareAtPrice);
  const hasDiscount =
    state.compareAtPrice.trim() !== "" &&
    Number.isFinite(price) &&
    Number.isFinite(compareAt) &&
    compareAt > price;

  const err = (key: keyof Errors) => (showErrors ? errors[key] : undefined);
  const invalid = (key: keyof Errors) => (err(key) ? true : undefined);

  return (
    <form id="product-form" onSubmit={handleSubmit} noValidate className="space-y-6">
      <PageHeader
        back={{ href: "/products", label: "Back to products" }}
        title={mode === "create" ? "Add product" : "Edit product"}
        description={
          mode === "create"
            ? "Fill in the details below. You can save it as a draft first."
            : product?.name
        }
        actions={
          mode === "edit" && product ? (
            <>
              {STORE_URL && product.status === "active" && (
                <Button variant="outline" asChild>
                  <a
                    href={`${STORE_URL}/products/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on store
                  </a>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDelete(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : undefined
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

      {formError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {showErrors && Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Please fix the highlighted fields before saving.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>What customers see first.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="product-name" label="Product name" required error={err("name")}>
                <Input
                  id="product-name"
                  value={state.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Scandinavian leather sofa"
                  aria-invalid={invalid("name")}
                  aria-describedby={err("name") ? "product-name-error" : undefined}
                  autoFocus={mode === "create"}
                />
              </Field>

              <Field
                id="product-slug"
                label="Web address (slug)"
                required
                error={err("slug")}
                hint={
                  mode === "edit"
                    ? "Changing this changes the product's web address, so old links will stop working."
                    : "Created from the name. You can edit it."
                }
              >
                <div className="flex gap-2">
                  <Input
                    id="product-slug"
                    value={state.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      update("slug", event.target.value.toLowerCase());
                    }}
                    placeholder="scandinavian-leather-sofa"
                    className="font-mono text-sm"
                    aria-invalid={invalid("slug")}
                    aria-describedby={err("slug") ? "product-slug-error" : undefined}
                  />
                  {slugTouched && mode === "create" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSlugTouched(false);
                        update("slug", slugify(state.name));
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </Field>

              <Field
                id="product-description"
                label="Description"
                hint={`${state.description.length}/10000 characters`}
              >
                <textarea
                  id="product-description"
                  rows={6}
                  maxLength={10000}
                  value={state.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Describe the materials, comfort, care and what makes it special..."
                  className={textareaClass}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Good photos sell furniture. Add several angles.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageManager images={state.images} onChange={(images) => update("images", images)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Amounts are in Kenyan shillings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="product-price" label="Price (KES)" required error={err("price")}>
                  <Input
                    id="product-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={state.price}
                    onChange={(event) => update("price", event.target.value)}
                    placeholder="0"
                    aria-invalid={invalid("price")}
                    aria-describedby={err("price") ? "product-price-error" : undefined}
                  />
                </Field>
                <Field
                  id="product-compare-at"
                  label="Compare-at price (KES)"
                  error={err("compareAtPrice")}
                  hint="The old price, shown struck through to display a discount."
                >
                  <Input
                    id="product-compare-at"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={state.compareAtPrice}
                    onChange={(event) => update("compareAtPrice", event.target.value)}
                    placeholder="Optional"
                    aria-invalid={invalid("compareAtPrice")}
                    aria-describedby={err("compareAtPrice") ? "product-compare-at-error" : undefined}
                  />
                </Field>
              </div>

              {hasDiscount && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Customers see{" "}
                  <strong>{Math.round((1 - price / compareAt) * 100)}% off</strong> and save{" "}
                  <strong>{formatPrice(compareAt - price)}</strong>.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                id="product-stock"
                label="Stock quantity"
                required
                error={err("stockQuantity")}
                hint={
                  state.stockQuantity.trim() !== "" && Number(state.stockQuantity) === 0
                    ? "Out of stock: customers can't add it to their cart."
                    : Number(state.stockQuantity) > 0 && Number(state.stockQuantity) <= LOW_STOCK_THRESHOLD
                      ? "Low stock warning will show on the store."
                      : undefined
                }
              >
                <Input
                  id="product-stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={state.stockQuantity}
                  onChange={(event) => update("stockQuantity", event.target.value)}
                  placeholder="0"
                  aria-invalid={invalid("stockQuantity")}
                  aria-describedby={err("stockQuantity") ? "product-stock-error" : undefined}
                />
              </Field>
              <Field id="product-sku" label="SKU" hint="Your own code for this product (optional).">
                <Input
                  id="product-sku"
                  value={state.sku}
                  onChange={(event) => update("sku", event.target.value)}
                  placeholder="e.g. SOF-MIL-001"
                  maxLength={100}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Shown on the product page, like dimensions or materials. Rows left empty are ignored.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.specs.map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Input
                    value={row.key}
                    onChange={(event) =>
                      update(
                        "specs",
                        state.specs.map((r) => (r.id === row.id ? { ...r, key: event.target.value } : r)),
                      )
                    }
                    placeholder="Name"
                    aria-label={`Detail ${index + 1} name`}
                    maxLength={60}
                    className="w-2/5"
                  />
                  <Input
                    value={row.value}
                    onChange={(event) =>
                      update(
                        "specs",
                        state.specs.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)),
                      )
                    }
                    placeholder="Value"
                    aria-label={`Detail ${index + 1} value`}
                    maxLength={500}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => update("specs", state.specs.filter((r) => r.id !== row.id))}
                    aria-label={`Remove detail ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  update("specs", [...state.specs, { id: nextSpecId.current++, key: "", value: "" }])
                }
              >
                <Plus className="h-4 w-4" />
                Add detail
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div role="radiogroup" aria-label="Product status" className="space-y-2">
                {STATUS_OPTIONS.map((option) => {
                  const selected = state.status === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update("status", option.value)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          selected ? "border-primary" : "border-muted-foreground/40",
                        )}
                        aria-hidden="true"
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p id="featured-label" className="text-sm font-medium">
                    Featured
                  </p>
                  <p className="text-xs text-muted-foreground">Show on the home page</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.featured}
                  aria-labelledby="featured-label"
                  onClick={() => update("featured", !state.featured)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    state.featured ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                      state.featured ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Field id="product-category" label="Category" required error={err("categoryId")}>
                <select
                  id="product-category"
                  value={state.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                  className={selectClass}
                  aria-invalid={invalid("categoryId")}
                  aria-describedby={err("categoryId") ? "product-category-error" : undefined}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Roughly how it looks in the store.</CardDescription>
            </CardHeader>
            <CardContent>
              <Preview state={state} category={categoryLabel} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {dirty ? (
            <span className="font-medium text-amber-700">You have unsaved changes</span>
          ) : mode === "edit" ? (
            "All changes saved"
          ) : (
            "Nothing entered yet"
          )}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            {mode === "edit" ? "Back" : "Cancel"}
          </Button>
          <Button
            type="submit"
            disabled={saving || (mode === "edit" && !dirty)}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Create product" : "Save changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product"
        description={
          <>
            Delete <span className="font-medium text-foreground">{product?.name}</span>? If it
            appears in past orders it will be archived instead, so order history stays intact.
          </>
        }
        confirmLabel="Delete"
        destructive
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard your changes?"
        description="You have unsaved changes. If you leave now they will be lost."
        confirmLabel="Discard changes"
        destructive
        onConfirm={() => {
          savedSnapshot.current = serialize(state);
          router.push("/products");
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </form>
  );
}
