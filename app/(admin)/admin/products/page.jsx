"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { showToast } from "@/lib/showToast";
import { ADMIN_ADD_PRODUCT, ADMIN_EDIT_PRODUCT } from "@/routes/adminPanelRoutes";
import BulkProductImport from "@/components/admin/BulkProductImport";
import InventoryManager from "@/components/admin/InventoryManager";

import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Download,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  Plus,
  Filter
} from "lucide-react";

/**
 * @typedef {Object} Product
 * @property {string} _id
 * @property {string} name
 * @property {string} slug
 * @property {string} sku
 * @property {number} price
 * @property {number} [salePrice]
 * @property {number} stock
 * @property {Object} [category]
 * @property {string} category.name
 * @property {string} category._id
 * @property {Array<{url: string}>} [images]
 * @property {boolean} isActive
 * @property {boolean} [isFeatured]
 * @property {boolean} [isNewArrival]
 * @property {boolean} [isBestSeller]
 * @property {string} [badge]
 * @property {string} [description]
 * @property {string} createdAt
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} props.productName
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {boolean} props.isDeleting
 */
function DeleteModal({ isOpen, productName, onConfirm, onCancel, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Delete Product</h3>
            <p className="text-sm text-gray-600">This will move the product to recycle bin</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <span className="font-semibold">"{productName}"</span>? 
          This will move the product to the recycle bin where you can restore it later.
        </p>
        
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  const abortControllerRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      abortControllerRef.current = new AbortController();
      
      const res = await fetch("/api/admin/products", {
        signal: abortControllerRef.current.signal,
      });
      
      if (!res.ok) {
        throw Error("Failed to fetch products");
      }
      
      const result = await res.json();
      
      if (result.ok) {
        const productsData = result?.data?.products || [];
        setProducts(productsData);
        setFilteredProducts(productsData);
      } else {
        setError(result.message || "Failed to fetch products");
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Fetch Error:", error);
      setError("Failed to load products. Please try again.");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  // Filter products based on search and status
  useEffect(() => {
    let filtered = [...products];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          (item.category?.name && item.category.name.toLowerCase().includes(term))
      );
    }
    
    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter((item) => item.isActive);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((item) => !item.isActive);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStatus]);

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    setDeletingId(productToDelete._id);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete._id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", data.message || "Failed to delete product");
        return;
      }

      showToast("success", data.message || `'${productToDelete.name}' moved to recycle bin`);
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("[Delete Error]:", err);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }, [productToDelete]);

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  const formatPrice = (price) => `₹${price.toLocaleString()}`;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-[#C17A56] mb-4" />
            <p className="text-gray-600">Loading products...</p>
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} {products.length === 1 ? 'product' : 'products'} total
            {filteredProducts.length !== products.length && ` (showing ${filteredProducts.length})`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={ADMIN_ADD_PRODUCT}
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg hover:bg-[#C17A56] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            Add Product
          </Link>
          <button
            type="button"
            onClick={() => setShowBulkImport(true)}
            className="bg-white text-[#1A1A1A] border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={18} />
            Bulk Import
          </button>
        </div>
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
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C17A56]"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              filterStatus !== "all" 
                ? "bg-[#C17A56] text-white border-[#C17A56]" 
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
            {filterStatus !== "all" && (
              <span className="bg-white text-[#C17A56] text-xs rounded-full px-2 py-0.5">
                1
              </span>
            )}
          </button>
          
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

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C17A56] bg-white"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Bulk Tools</h2>
              <p className="text-sm text-gray-500">Import products and update inventory in one place.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkImport(false)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Close
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BulkProductImport
              onImportComplete={() => {
                fetchProducts();
                setShowBulkImport(false);
                setSuccess("Bulk import completed successfully.");
              }}
            />
            <InventoryManager
              onComplete={() => {
                fetchProducts();
                setSuccess("Inventory updated successfully.");
              }}
            />
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">SKU</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Category</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={40} className="text-gray-300" />
                    <p className="text-gray-500">
                      {searchTerm || filterStatus !== "all" 
                        ? "No matching products found" 
                        : "No products found"}
                    </p>
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
              filteredProducts.map((item) => (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative">
                      {item?.images?.[0]?.url ? (
                        <Image
                          src={item.images[0].url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-[#1A1A1A]">{item.name}</div>
                      <div className="text-xs text-gray-400 md:hidden">SKU: {item.sku}</div>
                      {item.badge && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 bg-[#C17A56] text-white rounded mt-1">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-600 hidden md:table-cell">{item.sku}</td>
                  <td className="p-3 text-sm text-gray-600 hidden lg:table-cell">
                    {item.category?.name || "N/A"}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#1A1A1A]">
                      {formatPrice(item.price)}
                    </div>
                    {item.salePrice && (
                      <div className="text-xs text-red-500 line-through">
                        {formatPrice(item.salePrice)}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center ${
                      item.stock > 0 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {item.stock}
                      {item.stock === 0 && (
                        <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          Out of Stock
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        item.isActive ? "bg-green-500" : "bg-red-500"
                      }`} />
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={ADMIN_EDIT_PRODUCT(item._id)}
                        className="p-1.5 text-gray-600 hover:text-[#C17A56] hover:bg-[#C17A56]/10 rounded transition-colors"
                        title="Edit product"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        disabled={deletingId === item._id}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete product"
                      >
                        {deletingId === item._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        productName={productToDelete?.name || ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={!!deletingId}
      />
    </div>
  );
}