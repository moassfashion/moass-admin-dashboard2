"use client";

import { useState, useEffect } from "react";
import { X, Settings, Package, Eye } from "lucide-react";
import type { Section } from "@/types/homepage-sections";
import { SettingsTab } from "./SectionEditorModal/SettingsTab";
import { ProductsTab } from "./SectionEditorModal/ProductsTab";
import { PreviewTab } from "./SectionEditorModal/PreviewTab";

export type SectionEditorTab = "settings" | "products" | "preview";

const TAB_STORAGE_KEY = "homepage-section-editor-tab";

export function SectionEditorModal({
  open,
  onClose,
  sectionKey,
  section: initialSection,
}: {
  open: boolean;
  onClose: () => void;
  sectionKey: string;
  section: Section | null;
}) {
  const [activeTab, setActiveTab] = useState<SectionEditorTab>("settings");

  useEffect(() => {
    if (!open) return;
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY) as SectionEditorTab | null;
    if (stored && ["settings", "products", "preview"].includes(stored)) {
      setActiveTab(stored);
    } else {
      setActiveTab("settings");
    }
  }, [open]);

  const setTab = (tab: SectionEditorTab) => {
    setActiveTab(tab);
    sessionStorage.setItem(TAB_STORAGE_KEY, tab);
  };

  const title = initialSection?.title ?? sectionKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const tabs: { id: SectionEditorTab; label: string; icon: typeof Settings }[] = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "products", label: "Products", icon: Package },
    { id: "preview", label: "Preview", icon: Eye },
  ];

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/20"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex border-b border-gray-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {activeTab === "settings" && (
            <SettingsTab sectionKey={sectionKey} section={initialSection} />
          )}
          {activeTab === "products" && (
            <ProductsTab sectionKey={sectionKey} section={initialSection} />
          )}
          {activeTab === "preview" && (
            <PreviewTab sectionKey={sectionKey} />
          )}
        </div>
      </div>
    </div>
  );
}
