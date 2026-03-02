"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Section, SectionConfig, ResolvedSectionResponse } from "@/types/homepage-sections";

const API = "/api/admin/homepage-sections";

async function fetchSections(): Promise<{ sections: Section[] }> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch sections");
  return res.json();
}

async function fetchSection(key: string): Promise<ResolvedSectionResponse> {
  const res = await fetch(`${API}/${key}`);
  if (!res.ok) throw new Error("Failed to fetch section");
  return res.json();
}

async function updateSettings(
  key: string,
  data: Partial<SectionConfig>
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/${key}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to save");
  }
  return res.json();
}

async function pinProduct(
  key: string,
  productId: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/${key}/pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error("Failed to pin");
  return res.json();
}

async function unpinProduct(
  key: string,
  productId: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/${key}/pin?productId=${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to unpin");
  return res.json();
}

async function reorderPins(
  key: string,
  productIds: string[]
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/${key}/pin/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder");
  return res.json();
}

export function useSectionsQuery() {
  return useQuery({
    queryKey: ["homepage-sections"],
    queryFn: fetchSections,
  });
}

export function useSectionQuery(key: string | null) {
  return useQuery({
    queryKey: ["homepage-section", key],
    queryFn: () => fetchSection(key!),
    enabled: !!key,
  });
}

export function useUpdateSettingsMutation(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SectionConfig>) => updateSettings(key, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage-sections"] });
      qc.invalidateQueries({ queryKey: ["homepage-section", key] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePinProductMutation(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => pinProduct(key, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage-sections"] });
      qc.invalidateQueries({ queryKey: ["homepage-section", key] });
      toast.success("Product pinned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnpinProductMutation(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => unpinProduct(key, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage-sections"] });
      qc.invalidateQueries({ queryKey: ["homepage-section", key] });
      toast.success("Product unpinned");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReorderPinsMutation(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productIds: string[]) => reorderPins(key, productIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homepage-sections"] });
      qc.invalidateQueries({ queryKey: ["homepage-section", key] });
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
