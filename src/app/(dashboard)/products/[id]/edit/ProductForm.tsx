"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Bold, Italic, Underline, Strikethrough, Link2, List } from "lucide-react";
import { Save, Calendar, Plus, CloudUpload, ImagePlus, Trash2 } from "lucide-react";

type Category = { id: string; name: string; children?: { id: string; name: string }[] };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: { toString(): string };
  compareAt: { toString(): string } | null;
  categoryId: string | null;
  images: string | null;
  variationImages: string | null;
  stock: number;
  sku: string | null;
  published: boolean;
  sortOrder: number;
} | null;

type VariationItem = { key: string; label: string; images: string };

const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--teal)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)]";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const sectionTitleClass = "text-sm font-semibold text-gray-900";

const BRANDS = ["Adidas", "Nike", "Puma", "Others"];
const SIZES = ["Small", "Medium", "Large", "X-Large"];
const COLORS = ["Black", "White", "Black and White", "Navy", "Gray"];
const DISCOUNTS = ["0%", "5%", "10%", "15%", "20%", "25%"];

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product: Product;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isNew = !product;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [productDetails, setProductDetails] = useState(""); // bullet points, appended to description on save
  const [price, setPrice] = useState(product ? Number(product.price) : 0);
  const [compareAt, setCompareAt] = useState(product?.compareAt ? Number(product.compareAt) : "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [images, setImages] = useState(product?.images ?? "");
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [minStock, setMinStock] = useState(100);
  const [sku, setSku] = useState(product?.sku ?? "");
  const [published, setPublished] = useState(product?.published ?? true);
  const [brand, setBrand] = useState("Adidas");
  const [size, setSize] = useState("Medium");
  const [colors, setColors] = useState("Black and White");
  const [discount, setDiscount] = useState("15%");
  const [minOrder, setMinOrder] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Variation images: array of { key, label, images } so we can add/remove and show per-variation uploads
  const [variations, setVariations] = useState<VariationItem[]>(() => {
    try {
      const raw = product?.variationImages;
      if (!raw) return [];
      const obj = JSON.parse(raw) as Record<string, string>;
      return Object.entries(obj).map(([key, images]) => ({
        key,
        label: key.replace(/-/g, " / "),
        images: images || "",
      }));
    } catch {
      return [];
    }
  });

  const subCategories = categories.find((c) => c.id === categoryId)?.children ?? [];
  const imageUrls = images ? images.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const variationImagesJson =
    variations.length > 0
      ? JSON.stringify(
          Object.fromEntries(variations.map((v) => [v.key, v.images.trim()]).filter(([, im]) => im))
        )
      : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fullDescription = [description, productDetails].filter(Boolean).join("\n\n");
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description: fullDescription || undefined,
        price,
        compareAt: compareAt === "" ? undefined : Number(compareAt),
        categoryId: subCategoryId || categoryId || undefined,
        images: images || undefined,
        variationImages: variationImagesJson || undefined,
        stock,
        sku: sku || undefined,
        published,
        sortOrder: product?.sortOrder ?? 0,
      };
      const url = isNew ? "/api/admin/products" : `/api/admin/products/${product!.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      if (isNew) {
        startTransition(() => router.push(`/products/${data.id}/edit`));
      } else {
        startTransition(() => router.refresh());
      }
    } finally {
      setSaving(false);
    }
  }

  function removeImage(index: number) {
    const list = imageUrls.filter((_, i) => i !== index);
    setImages(list.join(", "));
  }

  /** প্রোডাক্ট ইমেজ API রিকোয়ারমেন্ট: ১:১ রেশিও। */
  function checkImage1to1(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        resolve(w > 0 && h > 0 && Math.abs(w - h) < 2);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      img.src = url;
    });
  }

  async function handleMainImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setError("");
    const is1to1 = await checkImage1to1(file);
    if (!is1to1) {
      setError("প্রোডাক্ট ইমেজ ১:১ রেশিও হতে হবে (বর্গাকার)।");
      return;
    }
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Image upload failed.");
        return;
      }
      const url = data.url as string;
      setImages((prev) => (prev ? `${prev}, ${url}` : url));
    } catch {
      setError("Upload failed.");
    }
  }

  function addVariation() {
    const key = `${size}-${colors}`;
    if (variations.some((v) => v.key === key)) return;
    setVariations((prev) => [...prev, { key, label: `${size} / ${colors}`, images: "" }]);
  }

  function setVariationImages(key: string, value: string) {
    setVariations((prev) => prev.map((v) => (v.key === key ? { ...v, images: value } : v)));
  }

  function removeVariation(key: string) {
    setVariations((prev) => prev.filter((v) => v.key !== key));
  }

  async function handleVariationImageUpload(variationKey: string, file: File) {
    if (!file.type.startsWith("image/")) return;
    setError("");
    const is1to1 = await checkImage1to1(file);
    if (!is1to1) {
      setError("প্রোডাক্ট ইমেজ ১:১ রেশিও হতে হবে (বর্গাকার)।");
      return;
    }
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Image upload failed.");
        return;
      }
      const url = data.url as string;
      setVariations((prev) =>
        prev.map((v) =>
          v.key === variationKey ? { ...v, images: v.images ? `${v.images}, ${url}` : url } : v
        )
      );
    } catch {
      setError("Upload failed.");
    }
  }

  if (product) {
    // Edit mode: existing two-column layout
    return (
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className={sectionTitleClass}>Details</div>
          </div>
          <div className="space-y-4 px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`min-h-[80px] ${inputClass} py-2`} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={saving || isPending}>{saving ? "Saving…" : isPending ? "Redirecting…" : "Save"}</Button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className={sectionTitleClass}>Pricing</div>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className={labelClass}>Price *</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Compare at (optional)</label>
                <input type="number" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className={sectionTitleClass}>Inventory</div>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className={labelClass}>Stock</label>
                <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className={sectionTitleClass}>Category</div>
            </div>
            <div className="px-6 py-4">
              <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(""); }} className={inputClass}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className={sectionTitleClass}>Media</div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainImageUpload}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:border-[var(--teal)] hover:bg-teal-50/30 hover:text-[var(--teal)]"
                >
                  <CloudUpload className="h-6 w-6" />
                  <span className="text-xs">Upload</span>
                </button>
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-24 w-24 rounded-lg border border-gray-200 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600">Remove</button>
                  </div>
                ))}
              </div>
              <div>
                <label className={labelClass}>Images (URLs, comma separated) — ১:১ রেশিও প্রয়োজন</label>
                <input type="text" value={images} onChange={(e) => setImages(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className={sectionTitleClass}>Variation Images</div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className={labelClass}>Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className={inputClass}>
                    {SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Color</label>
                  <select value={colors} onChange={(e) => setColors(e.target.value)} className={inputClass}>
                    {COLORS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Button type="button" variant="secondary" onClick={addVariation} className="inline-flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add variation
                </Button>
              </div>
              {variations.map((v) => {
                const urls = v.images ? v.images.split(",").map((s) => s.trim()).filter(Boolean) : [];
                return (
                  <div key={v.key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{v.label}</span>
                      <button type="button" onClick={() => removeVariation(v.key)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Remove variation">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input type="file" accept="image/*" className="hidden" id={`edit-var-${v.key}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVariationImageUpload(v.key, f); e.target.value = ""; }} />
                      <label htmlFor={`edit-var-${v.key}`} className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white text-gray-400 hover:border-[var(--teal)] hover:text-[var(--teal)]">
                        <ImagePlus className="h-4 w-4" />
                      </label>
                      {urls.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="h-16 w-16 rounded-lg border object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <button type="button" onClick={() => setVariationImages(v.key, urls.filter((_, j) => j !== i).join(", "))} className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 py-0.5 text-xs text-white">×</button>
                        </div>
                      ))}
                    </div>
                    <input type="text" value={v.images} onChange={(e) => setVariationImages(v.key, e.target.value)} placeholder="URLs (comma separated)" className={`mt-2 ${inputClass}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    );
  }

  // Add New Product: reference-style two-column layout
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Name and Description */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={sectionTitleClass}>Name and Description</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium Half Sleeve T-Shirt"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Product Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your product..."
                  className={`min-h-[100px] ${inputClass} py-2`}
                />
              </div>
              <div>
                <label className={labelClass}>Product Details</label>
                <div className="mb-1 flex gap-1 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 p-1">
                  <button type="button" className="rounded p-1.5 hover:bg-gray-200" title="Bold"><Bold className="h-4 w-4" /></button>
                  <button type="button" className="rounded p-1.5 hover:bg-gray-200" title="Italic"><Italic className="h-4 w-4" /></button>
                  <button type="button" className="rounded p-1.5 hover:bg-gray-200" title="Underline"><Underline className="h-4 w-4" /></button>
                  <button type="button" className="rounded p-1.5 hover:bg-gray-200" title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
                  <button type="button" className="rounded p-1.5 hover:bg-gray-200" title="Link"><Link2 className="h-4 w-4" /></button>
                  <button type="button" className="rounded p-1.5 hover:bg-gray-200" title="List"><List className="h-4 w-4" /></button>
                </div>
                <textarea
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  rows={3}
                  placeholder="• Body: 80% cotton/20% polyester&#10;• Colour Shown: Black/White&#10;• Style: FV7283-010"
                  className={`rounded-t-none ${inputClass} py-2`}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={sectionTitleClass}>Category</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Product Category</label>
                <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(""); }} className={inputClass}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Product Sub-Category</label>
                <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className={inputClass}>
                  <option value="">Select sub-category</option>
                  {subCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Manage Stock */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={sectionTitleClass}>Manage Stock</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Stock Keeping Unit</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-BB-66-A6" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Product Stock</label>
                <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} placeholder="10,120" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Minimum Stock</label>
                <input type="number" min={0} value={minStock} onChange={(e) => setMinStock(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Product Details (Brand, Size, Colors) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={sectionTitleClass}>Product Details</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>Brand Name</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Product Size</label>
                <select value={size} onChange={(e) => setSize(e.target.value)} className={inputClass}>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Product Colors</label>
                <select value={colors} onChange={(e) => setColors(e.target.value)} className={inputClass}>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Pricing */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={sectionTitleClass}>Product Pricing</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">৳</span>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} required className={`${inputClass} pl-8`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Discounted Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">৳</span>
                  <input type="number" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value === "" ? "" : Number(e.target.value))} className={`${inputClass} pl-8`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Discount</label>
                <select value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputClass}>
                  {DISCOUNTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Minimum Order</label>
                <input type="number" min={1} value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={`${sectionTitleClass} inline-flex items-center gap-1`}>
              Product Image
              <span className="text-gray-400" title="Info">ⓘ</span>
            </h3>
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMainImageUpload}
            />
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="flex h-32 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:border-[var(--teal)] hover:bg-teal-50/30 hover:text-[var(--teal)]"
              >
                <CloudUpload className="mb-1 h-8 w-8" />
                <span className="text-xs font-medium">Click to Upload</span>
              </button>
              {imageUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-32 w-32 rounded-xl border border-gray-200 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600">Remove</button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">প্রোডাক্ট ইমেজ ১:১ রেশিও হতে হবে। Or paste image URLs comma-separated below.</p>
            <input type="text" value={images} onChange={(e) => setImages(e.target.value)} placeholder="https://..." className={`mt-1 ${inputClass}`} />
          </div>

          {/* Variation Images (per Size/Color) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className={`${sectionTitleClass} inline-flex items-center gap-1`}>
              Variation Images
              <span className="text-gray-400" title="Add images per size/color">ⓘ</span>
            </h3>
            <p className="mt-1 text-xs text-gray-500">Add a variation (Size + Color) then attach images for that variation.</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className={labelClass}>Size</label>
                <select value={size} onChange={(e) => setSize(e.target.value)} className={inputClass}>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Color</label>
                <select value={colors} onChange={(e) => setColors(e.target.value)} className={inputClass}>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="secondary" onClick={addVariation} className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Add variation
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {variations.map((v) => {
                const urls = v.images ? v.images.split(",").map((s) => s.trim()).filter(Boolean) : [];
                return (
                  <div key={v.key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{v.label}</span>
                      <button type="button" onClick={() => removeVariation(v.key)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Remove variation">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`var-file-${v.key}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVariationImageUpload(v.key, file);
                          e.target.value = "";
                        }}
                      />
                      <label
                        htmlFor={`var-file-${v.key}`}
                        className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white text-gray-400 transition-colors hover:border-[var(--teal)] hover:bg-teal-50/30 hover:text-[var(--teal)]"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-xs">Upload</span>
                      </label>
                      {urls.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="h-20 w-20 rounded-lg border border-gray-200 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <button
                            type="button"
                            onClick={() => setVariationImages(v.key, urls.filter((_, j) => j !== i).join(", "))}
                            className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 py-0.5 text-xs text-white hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={v.images}
                      onChange={(e) => setVariationImages(v.key, e.target.value)}
                      placeholder="Or paste image URLs (comma separated)"
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <Button type="submit" disabled={saving || isPending} variant="secondary" className="inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : isPending ? "Redirecting…" : "Save Product"}
        </Button>
        <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
          <Calendar className="h-4 w-4" />
          Schedule
        </button>
        <Button type="submit" disabled={saving || isPending} className="inline-flex items-center gap-2 bg-[var(--success)] hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>
    </form>
  );
}
