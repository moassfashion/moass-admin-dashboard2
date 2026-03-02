"use client";

import { useState } from "react";
import { useSectionsQuery } from "./hooks/use-homepage-sections";
import { SectionCard } from "./SectionCard";
import { SectionEditorModal } from "./SectionEditorModal";
import type { Section } from "@/types/homepage-sections";

function SectionCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomepageSectionsClient() {
  const { data, isLoading, error } = useSectionsQuery();
  const [editorSection, setEditorSection] = useState<Section | null>(null);

  const sections = data?.sections ?? [];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load sections. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <SectionCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onManage={() => setEditorSection(section)}
            />
          ))}
        </div>
      )}

      <SectionEditorModal
        open={!!editorSection}
        onClose={() => setEditorSection(null)}
        sectionKey={editorSection?.key ?? ""}
        section={editorSection}
      />
    </div>
  );
}
