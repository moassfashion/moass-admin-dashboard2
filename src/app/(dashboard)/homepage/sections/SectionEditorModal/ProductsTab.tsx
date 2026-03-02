"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import {
  useSectionQuery,
  usePinProductMutation,
  useUnpinProductMutation,
  useReorderPinsMutation,
} from "../hooks/use-homepage-sections";
import { useProductsQuery, type ApiProduct } from "../hooks/use-products-categories";
import type { Section } from "@/types/homepage-sections";
import { Search, GripVertical, Pin, PinOff } from "lucide-react";
import toast from "react-hot-toast";

async function fetchTopProducts(limit: number): Promise<{ productId: string; quantity: number }[]> {
  const res = await fetch(`/api/admin/reports/top-products?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.top ?? []).map((t: { product: { id: string }; quantity: number }) => ({
    productId: t.product?.id,
    quantity: t.quantity,
  })).filter((x: { productId: string }) => x.productId);
}

function ProductRow({
  product,
  isPinned,
  onTogglePin,
  sectionKey,
  showSales,
  showDaysAgo,
  salesCount,
  daysAgo,
}: {
  product: ApiProduct;
  isPinned: boolean;
  onTogglePin: () => void;
  sectionKey: string;
  showSales?: boolean;
  showDaysAgo?: boolean;
  salesCount?: number;
  daysAgo?: number;
}) {
  const imageUrl = product.images ? product.images.split(",")[0]?.trim() : null;
  const price = typeof product.price === "object" && product.price && "toString" in product.price
    ? product.price.toString()
    : String(product.price);

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
      onClick={onTogglePin}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">—</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-500">
          {product.category?.name ?? "—"} · ${price}
          {showSales && salesCount !== undefined && ` · ${salesCount} sold`}
          {showDaysAgo && daysAgo !== undefined && ` · ${daysAgo} days ago`}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className={`shrink-0 rounded p-2 ${isPinned ? "text-amber-600" : "text-gray-400 hover:text-gray-600"}`}
        aria-label={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SortablePinnedItem({
  id,
  product,
  sectionKey,
  onUnpin,
  showSales,
  showDaysAgo,
  salesCount,
  daysAgo,
}: {
  id: string;
  product: { id: string; name: string; images: string | null; category?: { name: string } | null; price: string };
  sectionKey: string;
  onUnpin: () => void;
  showSales?: boolean;
  showDaysAgo?: boolean;
  salesCount?: number;
  daysAgo?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl = product.images ? product.images.split(",")[0]?.trim() : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${isDragging ? "border-gray-400 shadow-md" : "border-gray-200"}`}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">—</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-500">
          {product.category?.name ?? "—"} · ${product.price}
          {showSales && salesCount !== undefined && ` · ${salesCount} sold`}
          {showDaysAgo && daysAgo !== undefined && ` · ${daysAgo}d ago`}
        </p>
      </div>
      <button
        type="button"
        onClick={onUnpin}
        className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Unpin"
      >
        <PinOff className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductsTab({
  sectionKey,
  section,
}: {
  sectionKey: string;
  section: Section | null;
}) {
  const [search, setSearch] = useState("");

  const { data: sectionData, isLoading: sectionLoading } = useSectionQuery(sectionKey);
  const { data: productsData, isLoading: productsLoading } = useProductsQuery({});
  const pinMutation = usePinProductMutation(sectionKey);
  const unpinMutation = useUnpinProductMutation(sectionKey);
  const reorderMutation = useReorderPinsMutation(sectionKey);

  const { data: topProductsData } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => fetchTopProducts(100),
    enabled: sectionKey === "best_selling",
  });
  const salesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    if (topProductsData) topProductsData.forEach((t) => map.set(t.productId, t.quantity));
    return map;
  }, [topProductsData]);

  const pinnedIds = section?.config?.pinned_product_ids ?? [];
  const pinnedProducts = (sectionData?.products ?? []).filter((p) => p.source === "pinned");
  const mode = section?.config?.mode ?? "auto";
  const isAutoOnly = mode === "auto";
  const showSales = sectionKey === "best_selling";
  const showDaysAgo = sectionKey === "new_arrivals";

  const products: ApiProduct[] = productsData?.products ?? [];
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.name?.toLowerCase().includes(q))
    );
  }, [products, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = pinnedProductDetails.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ids, oldIndex, newIndex);
    reorderMutation.mutate(reordered);
  };

  const handleUnpinClick = (productId: string) => {
    toast(
      (t) => (
        <span>
          Unpin this product?{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => {
              unpinMutation.mutate(productId);
              toast.dismiss(t.id);
            }}
          >
            Yes
          </button>
          {" · "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </span>
      ),
      { duration: 5000 }
    );
  };

  const pinnedProductDetails = useMemo(() => {
    const resolved = sectionData?.products ?? [];
    return resolved.filter((p) => p.source === "pinned");
  }, [sectionData]);

  if (sectionLoading || productsLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="animate-pulse space-y-2">
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-24 rounded bg-gray-100" />
          <div className="h-24 rounded bg-gray-100" />
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-20 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-900">All products</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
        <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
          {filteredProducts.map((p) => {
            const price = typeof p.price === "object" && p.price && "toString" in p.price ? p.price.toString() : String(p.price);
            const isPinned = pinnedIds.includes(p.id);
            const salesCount = showSales ? salesByProduct.get(p.id) : undefined;
            const daysAgo = showDaysAgo && p.createdAt
              ? Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
              : undefined;
            return (
              <ProductRow
                key={p.id}
                product={p}
                isPinned={isPinned}
                onTogglePin={() => {
                  if (isPinned) handleUnpinClick(p.id);
                  else pinMutation.mutate(p.id);
                }}
                sectionKey={sectionKey}
                showSales={showSales}
                showDaysAgo={showDaysAgo}
                salesCount={salesCount}
                daysAgo={daysAgo}
              />
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-900">Pinned products</h3>
        {isAutoOnly && (
          <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            In auto mode, pinning has no effect on the frontend. Switch to manual or hybrid to use pinned products.
          </p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pinnedProductDetails.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {pinnedProductDetails.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No pinned products. Click a product on the left to pin it.</p>
              ) : (
                pinnedProductDetails.map((p) => (
                  <SortablePinnedItem
                    key={p.id}
                    id={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      images: p.image,
                      category: p.category ? { name: p.category } : null,
                      price: p.price,
                    }}
                    sectionKey={sectionKey}
                    onUnpin={() => handleUnpinClick(p.id)}
                    showSales={showSales}
                    showDaysAgo={showDaysAgo}
                    salesCount={p.total_sales}
                    daysAgo={p.days_ago}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
