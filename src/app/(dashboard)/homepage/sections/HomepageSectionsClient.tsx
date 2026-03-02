"use client";

import { useState } from "react";
import { useSectionsQuery, useDeleteSectionMutation } from "./hooks/use-homepage-sections";
import { SectionCard } from "./SectionCard";
import { SectionEditorModal } from "./SectionEditorModal";
import { AddSectionModal } from "./AddSectionModal";
import { EditSectionModal } from "./EditSectionModal";
import { DeleteSectionModal } from "./DeleteSectionModal";
import { Button } from "@/components/ui/Button";
import type { Section } from "@/types/homepage-sections";
import { Plus } from "lucide-react";

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
  const deleteSection = useDeleteSectionMutation();
  const [editorSection, setEditorSection] = useState<Section | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const sections = data?.sections ?? [];

  function handleConfirmDelete() {
    if (!sectionToDelete) return;
    deleteSection.mutate(sectionToDelete.key, {
      onSuccess: () => setSectionToDelete(null),
    });
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load sections. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAddModalOpen(true)}>
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add section
          </span>
        </Button>
      </div>

      {isLoading ? (
        <SectionCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onManage={() => setEditorSection(section)}
              onEdit={() => setEditSection(section)}
              onDelete={() => setSectionToDelete(section)}
            />
          ))}
        </div>
      )}

      {sectionToDelete && (
        <DeleteSectionModal
          open={!!sectionToDelete}
          onClose={() => setSectionToDelete(null)}
          section={sectionToDelete}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteSection.isPending}
        />
      )}

      <SectionEditorModal
        open={!!editorSection}
        onClose={() => setEditorSection(null)}
        sectionKey={editorSection?.key ?? ""}
        section={editorSection}
      />
      <AddSectionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <EditSectionModal open={!!editSection} onClose={() => setEditSection(null)} section={editSection} />
    </div>
  );
}
