"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SearchItem {
  _id?: string;
  title?: string;
  name?: string;
  slug?: string;
  description?: string;
  href: string;
  image?: string;
  images?: string[];
  price?: number;
}

interface SearchResponse {
  products: SearchItem[];
  categories: SearchItem[];
  pages: SearchItem[];
  links: SearchItem[];
  blogs: SearchItem[];
}

export default function SearchResult({
  search,
}: {
  search: string;
}) {
  const [results, setResults] = useState<SearchResponse>({
    products: [],
    categories: [],
    pages: [],
    links: [],
    blogs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

    fetchResults();
  }, [search]);

  const renderSection = (title: string, items: SearchItem[], emptyText: string) => {
    if (!items.length) return null;

    return (
      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const imageUrl = item.image || item.images?.[0] || "";

            return (
              <Link
                key={item._id || item.href}
                href={item.href}
                className="block rounded-lg border border-gray-200 p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name || item.title} className="h-16 w-16 rounded object-cover" />
                  ) : null}
                  <div>
                  <h4 className="font-semibold">{item.name || item.title}</h4>
                  {item.description ? <p className="mt-1 text-sm text-gray-600">{item.description}</p> : null}
                  {typeof item.price === "number" ? <p className="mt-2 font-bold">₹{item.price}</p> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  const hasResults = Object.values(results).some((items) => items.length > 0);

  return (
    <>
      <h2 className="mb-8 text-2xl font-bold">Search Results for "{search}"</h2>

      {!search ? (
        <p>Please enter a search term.</p>
      ) : !hasResults ? (
        <p>No results found.</p>
      ) : (
        <>
          {renderSection("Products", results.products, "No products found")}
          {renderSection("Categories", results.categories, "No categories found")}
          {renderSection("Pages", results.pages, "No pages found")}
          {renderSection("Links", results.links, "No links found")}
          {renderSection("Blog Posts", results.blogs, "No blog posts found")}
        </>
      )}
    </>
  );
}