/**
 * Config stored in HomepageSection.config (JSON string).
 */
export type SectionConfig = {
  mode: "auto" | "manual" | "hybrid";
  max_items: number;
  auto_days: number;
  auto_category: string | null;
  is_active: boolean;
  pinned_product_ids: string[];
};

const DEFAULT_CONFIG: SectionConfig = {
  mode: "auto",
  max_items: 8,
  auto_days: 30,
  auto_category: null,
  is_active: true,
  pinned_product_ids: [],
};

export function parseSectionConfig(raw: string | null): SectionConfig {
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<SectionConfig>;
    return {
      mode: parsed.mode ?? DEFAULT_CONFIG.mode,
      max_items: Math.min(16, Math.max(2, parsed.max_items ?? DEFAULT_CONFIG.max_items)),
      auto_days: Math.min(90, Math.max(7, parsed.auto_days ?? DEFAULT_CONFIG.auto_days)),
      auto_category: parsed.auto_category ?? DEFAULT_CONFIG.auto_category,
      is_active: parsed.is_active ?? DEFAULT_CONFIG.is_active,
      pinned_product_ids: Array.isArray(parsed.pinned_product_ids) ? parsed.pinned_product_ids : DEFAULT_CONFIG.pinned_product_ids,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function stringifySectionConfig(config: SectionConfig): string {
  return JSON.stringify(config);
}

export const HOMEPAGE_SECTION_KEYS = ["new_arrivals", "best_selling", "featured"] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export const SECTION_META: Record<
  HomepageSectionKey,
  { title: string; icon: string }
> = {
  new_arrivals: { title: "New Arrivals", icon: "Sparkles" },
  best_selling: { title: "Best Selling", icon: "TrendingUp" },
  featured: { title: "Featured", icon: "Star" },
};
