"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/Modal";

export type PaymentMethodRow = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  accountNumber: string | null;
  instructions: string | null;
  logoUrl: string | null;
  sortOrder: number;
};

const inputClass =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
const labelClass = "mb-1 block text-xs font-medium text-gray-700";

type FormState = {
  name: string;
  type: "COD" | "MANUAL";
  accountNumber: string;
  instructions: string;
  logoUrl: string;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: "",
  type: "COD",
  accountNumber: "",
  instructions: "",
  logoUrl: "",
  sortOrder: "0",
};

export function PaymentMethodsClient({
  initialMethods,
}: {
  initialMethods: PaymentMethodRow[];
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(m: PaymentMethodRow) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      type: m.type as "COD" | "MANUAL",
      accountNumber: m.accountNumber ?? "",
      instructions: m.instructions ?? "",
      logoUrl: m.logoUrl ?? "",
      sortOrder: String(m.sortOrder),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        accountNumber: form.type === "MANUAL" ? form.accountNumber.trim() || null : null,
        instructions: form.type === "MANUAL" ? form.instructions.trim() || null : null,
        logoUrl: form.logoUrl.trim() || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      if (editingId) {
        const res = await fetch(`/api/admin/payment-methods/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Update failed");
        const updated = await res.json();
        setMethods((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p))
        );
      } else {
        const res = await fetch("/api/admin/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Create failed");
        const created = await res.json();
        setMethods((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      closeModal();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Toggle failed");
      const updated = await res.json();
      setMethods((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: updated.isActive } : p))
      );
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this payment method? Orders using it will keep the reference but the method will be removed."))
      return;
    await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE" });
    setMethods((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  const isManual = form.type === "MANUAL";

  return (
    <div className="space-y-4">
      <Button type="button" onClick={openAdd}>
        Add Payment Method
      </Button>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="h-12 px-4 text-left">Name</th>
                <th className="h-12 px-4 text-left">Type</th>
                <th className="h-12 px-4 text-left">Account / Instructions</th>
                <th className="h-12 px-4 text-center">Active</th>
                <th className="h-12 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50"
                >
                  <td className="h-12 px-4 font-medium text-gray-900">{m.name}</td>
                  <td className="h-12 px-4 text-gray-700">{m.type}</td>
                  <td className="h-12 px-4 max-w-xs truncate text-gray-600">
                    {m.type === "MANUAL"
                      ? [m.accountNumber, m.instructions].filter(Boolean).join(" · ") || "—"
                      : "—"}
                  </td>
                  <td className="h-12 px-4 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={m.isActive}
                      disabled={togglingId === m.id}
                      onClick={() => toggleActive(m.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 ${
                        m.isActive ? "bg-gray-900" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                          m.isActive ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="h-12 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(m.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Payment Method" : "Add Payment Method"}
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. bKash, Nagad, Cash on Delivery"
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as "COD" | "MANUAL",
                }))
              }
            >
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="MANUAL">Manual (bKash/Nagad etc.)</option>
            </select>
          </div>
          {isManual && (
            <>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  className={inputClass}
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accountNumber: e.target.value }))
                  }
                  placeholder="e.g. 01XXXXXXXXX"
                />
              </div>
              <div>
                <label className={labelClass}>Instructions (shown to customer)</label>
                <textarea
                  className={inputClass + " min-h-[80px]"}
                  value={form.instructions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, instructions: e.target.value }))
                  }
                  placeholder="Send money to this number and enter your TrxID"
                />
              </div>
            </>
          )}
          <div>
            <label className={labelClass}>Logo URL (optional)</label>
            <input
              className={inputClass}
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={labelClass}>Sort Order</label>
            <input
              type="number"
              className={inputClass}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
