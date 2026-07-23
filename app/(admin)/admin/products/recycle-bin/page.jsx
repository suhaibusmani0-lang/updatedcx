"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Trash2, 
  RotateCcw,
  Package,
  Clock,
  Tag,
  DollarSign,
  Archive,
  Search
} from "lucide-react";

function ConfirmModal({ isOpen, productName, onConfirm, onCancel, isProcessing }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Permanent Delete</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">
          Are you sure you want to permanently delete <span className="font-semibold">"{productName}"</span>? 
          This will remove the product from the database forever and cannot be recovered.
        </p>
        
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Forever
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecycleBinPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const abortControllerRef = useRef(null);

  const fetchTrash = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      abortControllerRef.current = new AbortController();
      
      const res = await fetch("/api/admin/products/recycle-bin", {
        signal: abortControllerRef.current.signal,
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch deleted products");
      }
      
      const data = await res.json();
      
      if (data.ok) {
        setProducts(data.data || []);
        setFilteredProducts(data.data || []);
      } else {
        setError(data.message || "Failed to fetch deleted products");
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error fetching trash:", error);
      setError("Failed to load deleted products. Please try again.");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTrash]);

  // Filter products based on search
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = products.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          (item.category?.name && item.category.name.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchTerm]);

  const handleRestore = useCallback(async (id) => {
    setError(null);
    setSuccess(null);
    setRestoringId(id);
    
    try {
      const res = await fetch(`/api/admin/products/restore/${id}`, {
        method: "PATCH",
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to restore product");
      }
      
      setSuccess("Product restored successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Refetch to update the list
      await fetchTrash();
    } catch (error) {
      console.error("Error restoring product:", error);
      setError(error instanceof Error ? error.message : "Failed to restore product");
      setTimeout(() => setError(null), 3000);
    } finally {
      setRestoringId(null);
    }
  }, [fetchTrash]);

  const handlePermanentDeleteClick = (product) => {
    setProductToDelete(product);
    setConfirmModalOpen(true);
  };

  const confirmPermanentDelete = useCallback(async () => {
    if (!productToDelete) return;
    
    const id = productToDelete._id;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    setConfirmModalOpen(false);
    
    try {
      // Optimistic update
      setProducts((prev) => prev.filter((item) => item._id !== id));
      setFilteredProducts((prev) => prev.filter((item) => item._id !== id));
      
      const res = await fetch(`/api/admin/products/permanent-delete/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete product");
      }
      
      setSuccess("Product permanently deleted!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Refetch to sync with server
      await fetchTrash();
    } catch (error) {
      console.error("Error permanently deleting product:", error);
      setError(error instanceof Error ? error.message : "Failed to delete product");
      setTimeout(() => setError(null), 3000);
      // Revert optimistic update
      await fetchTrash();
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  }, [productToDelete, fetchTrash]);

  const cancelPermanentDelete = () => {
    setConfirmModalOpen(false);
    setProductToDelete(null);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-[#C17A56] mb-4" />
            <p className="text-gray-600">Loading deleted products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Archive size={24} className="text-gray-600" />
            Recycle Bin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} {products.length === 1 ? 'product' : 'products'} in trash
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/products")}
          className="text-sm text-[#C17A56] hover:underline flex items-center gap-1"
        >
          ← Back to Products
        </button>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search deleted products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C17A56]"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗑️</div>
          <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
            {searchTerm ? "No matching products found" : "Recycle bin is empty"}
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Products deleted from the admin panel will appear here"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-3 text-sm text-[#C17A56] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Product List */}
      {filteredProducts.length > 0 && (
        <div className="grid gap-4">
          {filteredProducts.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0].url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={24} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="font-semibold text-[#1A1A1A] truncate">
                      {item.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full whitespace-nowrap">
                      Deleted
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Tag size={14} />
                      {item.sku}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} />
                      ₹{item.price.toLocaleString()}
                      {item.salePrice && (
                        <span className="text-red-500 line-through ml-1">
                          ₹{item.salePrice.toLocaleString()}
                        </span>
                      )}
                    </span>
                    {item.category && (
                      <span className="flex items-center gap-1">
                        <Package size={14} />
                        {item.category.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Deleted: {formatDate(item.deletedAt)}
                    </span>
                    <span>
                      Stock: {item.stock}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore(item._id)}
                    disabled={restoringId === item._id}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {restoringId === item._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RotateCcw size={16} />
                    )}
                    <span className="hidden sm:inline">Restore</span>
                  </button>
                  <button
                    onClick={() => handlePermanentDeleteClick(item)}
                    disabled={deletingId === item._id}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {deletingId === item._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    <span className="hidden sm:inline">Delete Forever</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Permanent Delete Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        productName={productToDelete?.name || ""}
        onConfirm={confirmPermanentDelete}
        onCancel={cancelPermanentDelete}
        isProcessing={!!deletingId}
      />
    </div>
  );
}