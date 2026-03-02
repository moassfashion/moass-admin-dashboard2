"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useCategoriesQuery } from "../hooks/use-products-categories";
import { useUpdateSettingsMutation } from "../hooks/use-homepage-sections";
import type { Section, SectionConfig } from "@/types/homepage-sections";
import { Zap, Hand, Layers } from "lucide-react";

export function SettingsTab({
  sectionKey,
  section,
}: {
  sectionKey: string;
  section: Section | null;
}) {
  const updateSettings = useUpdateSettingsMutation(sectionKey);
  const { data: categoriesData } = useCategoriesQuery();

  const [mode, setMode] = useState<SectionConfig["mode"]>("auto");
  const [maxItems, setMaxItems] = useState(8);
  const [autoDays, setAutoDays] = useState(30);
  const [autoCategory, setAutoCategory] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!section) return;
    setMode(section.config.mode);
    setMaxItems(section.config.max_items);
    setAutoDays(section.config.auto_days);
    setAutoCategory(section.config.auto_category);
    setIsActive(section.config.is_active);
  }, [section]);

  const showAuto = mode === "auto" || mode === "hybrid";
  const categories = categoriesData ?? [];

  const handleSave = () => {
    updateSettings.mutate({
      mode,
      max_items: maxItems,
      ...(showAuto && { auto_days: autoDays, auto_category: autoCategory }),
      is_active: isActive,
    });
  };

  const modeCards: { value: SectionConfig["mode"]; icon: typeof Zap; label: string; desc: string }[] = [
    { value: "auto", icon: Zap, label: "Auto", desc: "Products picked by algorithm (newest, best-selling, etc.)" },
    { value: "manual", icon: Hand, label: "Manual", desc: "Only pinned products, full control" },
    { value: "hybrid", icon: Layers, label: "Hybrid", desc: "Pinned first, then auto-filled to max" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">Mode</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {modeCards.map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors ${
                mode === value
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon className="mb-2 h-6 w-6 text-gray-600" />
              <span className="font-medium text-gray-900">{label}</span>
              <span className="mt-1 text-xs text-gray-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Max items: {maxItems}
        </label>
        <input
          type="range"
          min={2}
          max={16}
          value={maxItems}
          onChange={(e) => setMaxItems(Number(e.target.value))}
          className="w-full max-w-xs"
        />
      </div>

      {showAuto && (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Auto window (days): {autoDays}
            </label>
            <input
              type="range"
              min={7}
              max={90}
              value={autoDays}
              onChange={(e) => setAutoDays(Number(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Auto category
            </label>
            <select
              value={autoCategory ?? ""}
              onChange={(e) => setAutoCategory(e.target.value || null)}
              className="h-10 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Active</span>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
            isActive ? "bg-gray-900" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isActive ? "translate-x-5" : "translate-x-0.5"
            }`}
            style={{ marginTop: 2 }}
          />
        </button>
        <span className="text-sm text-gray-500">{isActive ? "On" : "Off"}</span>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={updateSettings.isPending}
      >
        {updateSettings.isPending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
