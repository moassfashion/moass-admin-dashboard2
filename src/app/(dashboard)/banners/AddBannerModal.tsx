"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { ImagePlus, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

type AddBannerModalProps = {
  open: boolean;
  onClose: () => void;
};

const inputClass =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
const labelClass = "mb-1 block text-xs font-medium text-gray-700";

export function AddBannerModal({ open, onClose }: AddBannerModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, GIF, WebP).");
      return;
    }
    setError("");
    setImageFile(file);
    setImage("");
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function clearImage() {
    setImageFile(null);
    setImage("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const imageUrl = image.trim();
    if (!imageFile && !imageUrl) {
      setError("Add an image by uploading a file or pasting a URL.");
      return;
    }
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.set("file", imageFile);
        if (title) formData.set("title", title);
        if (link) formData.set("link", link);
        const res = await fetch("/api/admin/banners", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Failed to create banner.");
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || undefined,
            image: imageUrl,
            link: link || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Failed to create banner.");
          setSaving(false);
          return;
        }
      }
      router.refresh();
      onClose();
      setTitle("");
      setImage("");
      setLink("");
      clearImage();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    clearImage();
    setTitle("");
    setImage("");
    setLink("");
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add banner">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <div>
          <label className={labelClass}>Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Banner title"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Image</label>
          {preview || image ? (
            <div className="space-y-2">
              <div className="relative inline-block overflow-hidden rounded-md border border-gray-200">
                <img
                  src={preview || image}
                  alt="Preview"
                  className="h-32 w-auto max-w-full object-contain"
                />
                <Button type="button" variant="secondary" className="absolute right-2 top-2" onClick={clearImage}>
                  Remove
                </Button>
              </div>
              <p className="text-xs text-gray-500">Or choose another image below.</p>
            </div>
          ) : null}
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <span className="inline-flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Attach image
              </span>
            </Button>
            <span className="text-sm text-gray-400">or</span>
            <input
              type="url"
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                if (imageFile) clearImage();
              }}
              placeholder="Paste image URL"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={`${labelClass} flex items-center gap-1.5`}>
            <LinkIcon className="h-4 w-4" />
            Link (optional)
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create banner"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
