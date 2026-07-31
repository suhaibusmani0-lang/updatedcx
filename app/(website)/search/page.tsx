import SearchResult from "./SearchResult";
import ProductFilterSidebar from "@/components/website/ProductFilterSidebar";
import MobileToolbar from "@/components/website/MobileToolbar";

type SearchParams = Promise<{ q?: string; sort?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentQuery = params.q || "";
  const currentSort = params.sort || "newest";

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 pb-20 lg:pb-10">
      <SearchResult search={currentQuery} />

      {/* MOBILE STICKY TOOLBAR FOR SEARCH PAGE */}
      <MobileToolbar 
        currentSort={currentSort} 
        filterNode={<ProductFilterSidebar basePath={`/search?q=${encodeURIComponent(currentQuery)}`} />} 
      />
    </div>
  );
}