"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { showToast } from "@/lib/showToast";

export default function MediaGallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", alt: "" });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        showToast("error", data?.message || `Unable to load media (${response.status})`);
        setMedia([]);
        return;
      }
      const payload = data?.data ?? data;
      setMedia(Array.isArray(payload) ? payload : []);
    } catch (error) {
      showToast("error", error.message || "Unable to load media");
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const listener = () => fetchMedia();
    window.addEventListener("media-uploaded", listener);
    return () => window.removeEventListener("media-uploaded", listener);
  }, []);

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ title: item.title || "", alt: item.alt || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", alt: "" });
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: editForm.title, alt: editForm.alt }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast("error", data.message || "Update failed");
        return;
      }
      showToast("success", data.message || "Media updated");
      cancelEdit();
      fetchMedia();
    } catch (error) {
      showToast("error", error.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this media item?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/media?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        showToast("error", data.message || "Failed to delete media");
        return;
      }
      showToast("success", data.message || "Media deleted");
      await fetchMedia();
    } catch (error) {
      showToast("error", error.message || "Failed to delete media");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading media...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {media.map((item) => (
          <div key={item._id} className="rounded-lg border p-3 bg-white shadow-sm">
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
              <img
                src={item.thumbnailUrl || item.path}
                alt={item.title || "Media"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 space-y-2">
              {editingId === item._id ? (
                <>
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    value={editForm.title}
                    placeholder="Title"
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    value={editForm.alt}
                    placeholder="Alt text"
                    onChange={(e) => setEditForm((prev) => ({ ...prev, alt: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(item._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm truncate">{item.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.publicId || item.assetId}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.alt || "No alt text"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" onClick={() => startEdit(item)} aria-label="Edit media">
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                      aria-label="Delete media"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {!media.length && <p className="text-sm text-muted-foreground">No uploaded media found.</p>}
    </div>
  );
}
