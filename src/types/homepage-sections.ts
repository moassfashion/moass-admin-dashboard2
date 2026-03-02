export type SectionMode = "auto" | "manual" | "hybrid";

export interface Section {
  id: string;
  key: string;
  title?: string;
  mode: SectionMode;
  is_active: boolean;
  pinned_count: number;
  max_items: number;
  auto_days?: number;
  auto_category?: string | null;
  config: SectionConfig;
}

export interface SectionConfig {
  mode: SectionMode;
  max_items: number;
  auto_days: number;
  auto_category: string | null;
  is_active: boolean;
  pinned_product_ids: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  images?: string | null;
  category?: { id: string; name: string } | null;
  categoryId?: string | null;
  total_sales?: number;
  createdAt?: string;
}

export interface PinnedProduct extends Product {
  sortOrder?: number;
}

export interface ResolvedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  category: string | null;
  source: "pinned" | "auto";
  total_sales?: number;
  days_ago?: number;
}

export interface ResolvedSectionResponse {
  section: Section & { pinned_product_ids?: string[] };
  products: ResolvedProduct[];
  pinned_count: number;
  auto_count: number;
}
