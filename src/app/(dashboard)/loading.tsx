export default function DashboardLoading() {
  return (
    <div className="min-h-full animate-pulse">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="mt-1 h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-lg border border-gray-200 bg-white" />
          <div className="h-80 rounded-lg border border-gray-200 bg-white" />
        </div>
        <div className="h-64 rounded-lg border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
