import SearchResult from "./SearchResult";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <SearchResult search={params.q || ""} />
    </div>
  );
}