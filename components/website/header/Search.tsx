"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Package, FolderTree } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  _id: string;
  slug: string;
  name: string;
  price?: number;
  salePrice?: number;
  images?: {
    url: string;
  }[];
}

interface CategoryResult {
  _id: string;
  slug: string;
  name: string;
}

export default function SearchBar() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Search API
  useEffect(() => {
    if (!debounced.trim()) {
      setProducts([]);
      setCategories([]);
      setOpen(false);
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);

        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(debounced)}&limit=8`),
          fetch(`/api/categories?search=${encodeURIComponent(debounced)}`),
        ]);

        const productsData = await productsRes.json().catch(() => ({}));
        const categoriesData = await categoriesRes.json().catch(() => ({}));

        setProducts(productsData.products || productsData.data?.products || []);
        setCategories(categoriesData.data || categoriesData.categories || []);
        setOpen(true);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debounced]);

  // Close Outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);

    return () => {
      window.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!search.trim()) return;

    setOpen(false);

    router.push(`/search?q=${search}`);
  };

  return (
    <div className="hidden lg:block w-full">
      <div ref={wrapperRef} className="relative w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="sticky top-0 z-30 flex items-center border-b border-gray-400 bg-white w-full"
        >
          {/* Yahan par value={search || ""} lagaya hai error fix karne ke liye 👇 */}
          <input
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 py-2 outline-none bg-transparent text-sm px-1 text-gray-800"
          />

          <button type="submit" className="p-2 text-gray-700 hover:text-black">
            <Search size={18} />
          </button>
        </form>

        {open && (
          <div className="absolute left-0 top-full w-full bg-white border border-gray-300 shadow-xl z-[9999]">

            {/* Loading */}
            {loading && (
              <div className="p-5 text-center text-sm text-gray-500">
                Searching...
              </div>
            )}

            {/* Product + Category Suggestions */}
            {!loading && (products.length > 0 || categories.length > 0) && (
              <>
                {categories.length > 0 && (
                  <div className="border-b border-gray-200 py-2">
                    <div className="px-4 py-1 text-[11px] uppercase tracking-wide text-gray-500">
                      Categories
                    </div>
                    {categories.slice(0, 5).map((category) => (
                      <Link
                        href={`/category/${category.slug}`}
                        key={category._id}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm text-gray-800"
                      >
                        <FolderTree size={14} className="text-gray-500" />
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}

                {products.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-[11px] uppercase tracking-wide text-gray-500">
                      Products
                    </div>
                    {products.slice(0, 5).map((item) => (
                      <Link
                        href={`/product/${item.slug}`}
                        key={item._id}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100 text-sm text-gray-800 truncate"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50">
                  {products.slice(0, 3).map((item) => (
                    <Link
                      href={`/product/${item.slug}`}
                      key={item._id}
                      onClick={() => setOpen(false)}
                      className="bg-white p-2 border border-gray-200 rounded cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center text-center"
                    >
                      <div className="w-16 h-16 bg-gray-100 mb-1 overflow-hidden flex items-center justify-center">
                        {item.images?.length ? (
                          <img
                            src={item.images[0].url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-700 line-clamp-2 leading-tight w-full">
                        {item.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {!loading &&
              debounced &&
              products.length === 0 &&
              categories.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No results found
                </div>
              )}

          </div>
        )}
      </div>
    </div>
  );
}