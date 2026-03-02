"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { Section } from "@/types/homepage-sections";

export function DeleteSectionModal({
  open,
  onClose,
  section,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  section: Section | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !section) return null;

  const title = section.title ?? section.key;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
    >
      <h3 id="delete-modal-title" className="text-lg font-semibold text-gray-900">
        Delete section?
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        &quot;{title}&quot; will be removed. This cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
          No, cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => onConfirm()}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting…" : "Yes, delete"}
        </Button>
      </div>
    </div>
  );
}
