"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ADMIN_ADD_CATEGORY, ADMIN_EDIT_CATEGORY } from "@/routes/adminPanelRoutes";
import { Loader2, Search, X, AlertCircle, CheckCircle, Trash2, Edit, Plus } from "lucide-react";
import { showToast } from "@/lib/showToast";

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parent?: { _id: string; name: string; slug: string } | string | null;
  createdAt?: string;
  updatedAt?: string;
  depth?: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteModal({ isOpen, categoryName, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Delete Category</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <span className="font-semibold">"{categoryName}"</span>?
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button onClick={onCancel} disabled={isDeleting} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                Delete Category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      abortControllerRef.current = new AbortController();
      
      const res = await fetch("/api/admin/categories", {
        signal: abortControllerRef.current.signal,
      });
      
      const data = await res.json();
      
      if (data.ok) {
        const categoriesData = Array.isArray(data.data) ? data.data : [];

        // Build hierarchical list for display
        const map: Record<string, any> = {};
        categoriesData.forEach((c: any) => (map[c._id] = { ...c, children: [] }));
        const roots: any[] = [];
        categoriesData.forEach((c: any) => {
          const pid = c.parent && typeof c.parent === "object" ? c.parent._id : c.parent;
          if (pid) {
            if (map[pid]) map[pid].children.push(map[c._id]);
            else roots.push(map[c._id]);
          } else {
            roots.push(map[c._id]);
          }
        });

        const ordered: any[] = [];
        const dfs = (node: any, depth = 0) => {
          ordered.push({ ...node, depth });
          node.children.sort((a: any, b: any) => a.name.localeCompare(b.name)).forEach((ch: any) => dfs(ch, depth + 1));
        };
        roots.sort((a, b) => a.name.localeCompare(b.name)).forEach((r) => dfs(r, 0));

        setCategories(ordered);
        setFilteredCategories(ordered);
        setCategoryTree(buildTreeFromList(ordered));
      } else {
        setError(data.message || "Failed to fetch categories");
        setCategories([]);
        setFilteredCategories([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Fetch Categories Error:", error);
      showToast("error", "Failed to load categories. Please try again.");
      setError("Failed to load categories. Please try again.");
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCategories]);

  // Filter categories based on search and status
  useEffect(() => {
    let filtered = [...categories];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(term) ||
          cat.slug.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter((cat) => cat.isActive);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((cat) => !cat.isActive);
    }
    
    setFilteredCategories(filtered);
    setCategoryTree(buildTreeFromList(filtered));
  }, [categories, searchTerm, filterStatus]);

  const buildTreeFromList = (list: any[]) => {
    const map: Record<string, any> = {};
    list.forEach((c) => (map[c._id] = { ...c, children: [] }));
    const roots: any[] = [];
    list.forEach((c) => {
      const pid = c.parent && typeof c.parent === "object" ? c.parent._id : c.parent;
      if (pid) {
        if (map[pid]) map[pid].children.push(map[c._id]);
        else roots.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });
    // sort children
    const sortRec = (nodes: any[]) => {
      nodes.sort((a: any, b: any) => a.name.localeCompare(b.name));
      nodes.forEach((n) => n.children && sortRec(n.children));
    };
    sortRec(roots);
    return roots;
  };

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderRows = (nodes: any[], depth = 0): React.ReactElement[] => {
    return nodes.flatMap((node: any) => {
      const row = (
        <tr key={node._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td className="p-3">
            <div className="font-medium text-[#1A1A1A] flex items-center gap-2">
              {node.children && node.children.length > 0 ? (
                <button onClick={() => toggleOpen(node._id)} className="text-sm text-gray-500">
                  {openIds[node._id] ? "▾" : "▸"}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <span className="pl-2" style={{ paddingLeft: `${depth * 12}px` }}>{node.name}</span>
              {node.parent ? (
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Sub</span>
              ) : (
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">Root</span>
              )}
            </div>
            <div className="text-xs text-gray-400 md:hidden">/{node.slug}</div>
          </td>
          <td className="p-3 text-sm text-gray-500 hidden md:table-cell">{node.slug}</td>
          <td className="p-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              node.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${node.isActive ? "bg-green-500" : "bg-red-500"}`} />
              {node.isActive ? "Active" : "Inactive"}
            </span>
          </td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <Link href={ADMIN_EDIT_CATEGORY(node._id)} className="p-1.5 text-gray-600 hover:text-[#C17A56] hover:bg-[#C17A56]/10 rounded transition-colors" title="Edit category">
                <Edit size={16} />
              </Link>
              <button onClick={() => handleDeleteClick(node)} disabled={deletingId === node._id} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Delete category">
                {deletingId === node._id ? (<Loader2 size={16} className="animate-spin" />) : (<Trash2 size={16} />)}
              </button>
            </div>
          </td>
        </tr>
      );
      const childrenRows = (node.children && node.children.length && openIds[node._id]) ? renderRows(node.children, depth + 1) : [];
      return [row, ...childrenRows];
    });
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    const id = categoryToDelete._id;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    
    try {
      // Optimistic update - remove from UI immediately
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      setFilteredCategories((prev) => prev.filter((cat) => cat._id !== id));
      setDeleteModalOpen(false);
      setSuccess(`Category "${categoryToDelete.name}" deleted successfully`);
      setTimeout(() => setSuccess(null), 3000);
      
      const res = await fetch(`/api/admin/categories/${id}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        // Revert optimistic update on error
        const data = await res.json().catch(() => ({}));
        showToast("error", data.message || "Failed to delete category");
        return;
      }
      
      // Refetch to sync with server
      await fetchCategories();
    } catch (error) {
      console.error("Delete Category Error:", error);
      showToast("error", error instanceof Error ? error.message : "Failed to delete category");
      setError(error instanceof Error ? error.message : "Failed to delete category");
      // Revert optimistic update by refetching
      await fetchCategories();
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-[#C17A56] mb-4" />
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product categories
          </p>
        </div>
        <Link
          href={ADMIN_ADD_CATEGORY}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg hover:bg-[#C17A56] transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} />
          Add Category
        </Link>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle size={18} className="text-green-600" />
          <span className="text-green-800 text-sm flex-1">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={18} className="text-red-600" />
          <span className="text-red-800 text-sm flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C17A56]"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C17A56] bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          {(searchTerm || filterStatus !== "all") && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {filteredCategories.length} of {categories.length} categories
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Slug</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-8">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-500">No categories found</p>
                    {(searchTerm || filterStatus !== "all") && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-[#C17A56] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              renderRows(categoryTree)
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        categoryName={categoryToDelete?.name || ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={!!deletingId}
      />
    </div>
  );
}