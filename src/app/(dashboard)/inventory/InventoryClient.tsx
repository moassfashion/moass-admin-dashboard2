"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Product = { id: string; name: string; stock: number; sku: string | null; categories: { name: string }[] };

export function InventoryClient({ lowStock }: { lowStock: Product[] }) {
  const router = useRouter();
  const [stock, setStock] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function updateStock(id: string, newStock: number) {
    setSaving(id);
    try {
      await fetch(`/api/admin/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="h-12 px-4 text-left">Product</th>
              <th className="h-12 px-4 text-left">Category</th>
              <th className="h-12 px-4 text-right">Current stock</th>
              <th className="h-12 px-4 text-right">Update</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50 ${
                  p.stock <= 2 ? "bg-orange-50/50" : ""
                }`}
              >
                <td className="h-12 px-4 font-medium">
                  <Link href={`/products/${p.id}/edit`} className="text-gray-900 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="h-12 px-4 text-gray-700">{p.categories?.length ? p.categories.map((c) => c.name).join(", ") : "—"}</td>
                <td className="h-12 px-4 text-right text-gray-900">{p.stock}</td>
                <td className="h-12 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      onChange={(e) => setStock((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                      className="h-9 w-20 rounded-md border border-gray-300 bg-white px-2 text-right text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <Button
                      type="button"
                      onClick={() => updateStock(p.id, stock[p.id] ?? p.stock)}
                      disabled={saving === p.id}
                    >
                      {saving === p.id ? "…" : "Save"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lowStock.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">No low-stock products.</p>
      )}
    </div>
  );
}
