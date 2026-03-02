"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  List,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";

type MenuItemJson = {
  id: string;
  menuGroupId: string;
  label: string;
  link: string;
  sortOrder: number;
};

type MenuGroupJson = {
  id: string;
  key: string;
  label: string;
  placement: string;
  sortOrder: number;
  items?: MenuItemJson[];
};

const inputClass =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

export function MenusClient({
  initialGroups,
}: {
  initialGroups: MenuGroupJson[];
}) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(groups.map((g) => g.id)));
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [addItemGroupId, setAddItemGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Add group form
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPlacement, setNewPlacement] = useState<"header" | "footer">("footer");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemLink, setNewItemLink] = useState("");
  const [editGroupLabel, setEditGroupLabel] = useState("");
  const [editGroupKey, setEditGroupKey] = useState("");
  const [editGroupPlacement, setEditGroupPlacement] = useState<"header" | "footer">("footer");
  const [editItemLabel, setEditItemLabel] = useState("");
  const [editItemLink, setEditItemLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function createGroup() {
    if (!newKey.trim() || !newLabel.trim()) {
      setError("Key and label required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/menu-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          label: newLabel.trim(),
          placement: newPlacement,
          sortOrder: groups.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create group.");
        return;
      }
      setGroups((prev) => [...prev, { ...data, items: [] }]);
      setShowAddGroup(false);
      setNewKey("");
      setNewLabel("");
      setNewPlacement("footer");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateGroup(id: string) {
    if (!editGroupKey.trim() || !editGroupLabel.trim()) {
      setError("Key and label required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/menu-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editGroupKey.trim(),
          label: editGroupLabel.trim(),
          placement: editGroupPlacement,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update group.");
        return;
      }
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...data, items: g.items ?? [] } : g))
      );
      setEditingGroupId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm("Delete this menu group and all its items?")) return;
    await fetch(`/api/admin/menu-groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setEditingGroupId(null);
    setAddItemGroupId(null);
    router.refresh();
  }

  async function createItem(menuGroupId: string) {
    if (!newItemLabel.trim() || !newItemLink.trim()) {
      setError("Label and link required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuGroupId,
          label: newItemLabel.trim(),
          link: newItemLink.trim(),
          sortOrder: groups.find((g) => g.id === menuGroupId)?.items?.length ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add item.");
        return;
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === menuGroupId
            ? { ...g, items: [...(g.items ?? []), data] }
            : g
        )
      );
      setAddItemGroupId(null);
      setNewItemLabel("");
      setNewItemLink("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string, menuGroupId: string) {
    if (!editItemLabel.trim() || !editItemLink.trim()) {
      setError("Label and link required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editItemLabel.trim(),
          link: editItemLink.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update item.");
        return;
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === menuGroupId
            ? {
                ...g,
                items: (g.items ?? []).map((i) => (i.id === id ? data : i)),
              }
            : g
        )
      );
      setEditingItemId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string, menuGroupId: string) {
    if (!confirm("Remove this menu item?")) return;
    await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
    setGroups((prev) =>
      prev.map((g) =>
        g.id === menuGroupId
          ? { ...g, items: (g.items ?? []).filter((i) => i.id !== id) }
          : g
      )
    );
    setEditingItemId(null);
    router.refresh();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEditGroup(g: MenuGroupJson) {
    setEditGroupKey(g.key);
    setEditGroupLabel(g.label);
    setEditGroupPlacement((g.placement as "header" | "footer") || "footer");
    setEditingGroupId(g.id);
    setError("");
  }

  function openEditItem(item: MenuItemJson) {
    setEditItemLabel(item.label);
    setEditItemLink(item.link);
    setEditingItemId(item.id);
    setError("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          Add menu groups (e.g. CATEGORY, QUICK LINKS) and links. Storefront will show them in footer/header via{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">GET /api/ecommerce/menus</code>.
        </p>
        <Button type="button" onClick={() => setShowAddGroup(true)}>
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add menu group
          </span>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add group modal */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Add menu group</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500">Key (unique, e.g. footer_quick_links)</label>
                <input
                  className={inputClass}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="footer_quick_links"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Label (e.g. Quick Links)</label>
                <input
                  className={inputClass}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Quick Links"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Placement</label>
                <select
                  className={inputClass}
                  value={newPlacement}
                  onChange={(e) => setNewPlacement(e.target.value as "header" | "footer")}
                >
                  <option value="footer">Footer</option>
                  <option value="header">Header</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddGroup(false)}>
                Cancel
              </Button>
              <Button onClick={createGroup} disabled={saving}>
                {saving ? "Saving…" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List of groups */}
      <div className="space-y-2">
        {groups.map((g) => (
          <div
            key={g.id}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
          >
            <div
              className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(g.id)}
            >
              {expanded.has(g.id) ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <span className="font-medium text-gray-900">{g.label}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {g.placement}
              </span>
              <span className="text-xs text-gray-400">({g.key})</span>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditGroup(g);
                  }}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Edit group"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup(g.id);
                  }}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </div>

            {editingGroupId === g.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4" onClick={(e) => e.stopPropagation()}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Key</label>
                    <input
                      className={inputClass}
                      value={editGroupKey}
                      onChange={(e) => setEditGroupKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Label</label>
                    <input
                      className={inputClass}
                      value={editGroupLabel}
                      onChange={(e) => setEditGroupLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Placement</label>
                    <select
                      className={inputClass}
                      value={editGroupPlacement}
                      onChange={(e) => setEditGroupPlacement(e.target.value as "header" | "footer")}
                    >
                      <option value="footer">Footer</option>
                      <option value="header">Header</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setEditingGroupId(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => updateGroup(g.id)} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {expanded.has(g.id) && (
              <div className="border-t border-gray-100 p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase text-gray-500">Menu items</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setAddItemGroupId(g.id);
                      setNewItemLabel("");
                      setNewItemLink("");
                      setError("");
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add item
                    </span>
                  </Button>
                </div>

                {addItemGroupId === g.id && (
                  <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className={inputClass}
                        placeholder="Label (e.g. Terms & Conditions)"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                      />
                      <input
                        className={inputClass}
                        placeholder="Link (e.g. /terms)"
                        value={newItemLink}
                        onChange={(e) => setNewItemLink(e.target.value)}
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button onClick={() => createItem(g.id)} disabled={saving}>
                        {saving ? "Adding…" : "Add"}
                      </Button>
                      <Button variant="secondary" onClick={() => setAddItemGroupId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <ul className="space-y-1">
                  {(g.items ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-md py-2 px-2 hover:bg-gray-50"
                    >
                      {editingItemId === item.id ? (
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          <input
                            className={`${inputClass} max-w-[140px]`}
                            value={editItemLabel}
                            onChange={(e) => setEditItemLabel(e.target.value)}
                            placeholder="Label"
                          />
                          <input
                            className={`${inputClass} flex-1 min-w-[120px]`}
                            value={editItemLink}
                            onChange={(e) => setEditItemLink(e.target.value)}
                            placeholder="Link"
                          />
                          <Button
                            onClick={() => updateItem(item.id, g.id)}
                            disabled={saving}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setEditingItemId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-gray-900"
                          >
                            {item.label}
                          </a>
                          <span className="truncate text-xs text-gray-400 max-w-[180px]">
                            {item.link}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Edit item"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id, g.id)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                {(g.items ?? []).length === 0 && addItemGroupId !== g.id && (
                  <p className="py-2 text-sm text-gray-500">No items. Add links above.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <List className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No menu groups yet.</p>
          <Button type="button" className="mt-3" onClick={() => setShowAddGroup(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add menu group
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
