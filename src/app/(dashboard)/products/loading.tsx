export default function ProductsLoading() {
  return (
    <div className="min-h-full animate-pulse">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="mt-1 h-4 w-64 rounded bg-gray-100" />
      </div>
      <div className="p-6">
        <div className="h-10 w-full rounded-lg bg-gray-200" />
        <div className="mt-4 h-64 rounded-lg border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
