import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";

export default async function ProductsPage() {
  const [user, products] = await Promise.all([
    getCurrentUser(),
    prisma.product.findMany({
      take: 50,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { category: true },
    }),
  ]);
  if (!user) redirect("/auth/v2/login");
  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[{ label: "Products" }]}
        actions={
          <Link
            href="/products/new"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-gray-700"
          >
            New product
          </Link>
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="h-12 w-12 px-2 text-left"></th>
                  <th className="h-12 px-4 text-left">Name</th>
                  <th className="h-12 px-4 text-left">Category</th>
                  <th className="h-12 px-4 text-right">Price</th>
                  <th className="h-12 px-4 text-right">Stock</th>
                  <th className="h-12 px-4 text-left">Status</th>
                  <th className="h-12 w-10 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="group border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50">
                    <td className="h-12 px-2">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                        {p.images ? (
                          <img
                            src={p.images.split(",")[0].trim()}
                            alt=""
                            className="h-10 w-10 object-cover"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="h-12 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.sku && <p className="text-xs text-gray-500">{p.sku}</p>}
                      </div>
                    </td>
                    <td className="h-12 px-4 text-gray-700">{p.category?.name ?? "—"}</td>
                    <td className="h-12 px-4 text-right font-medium text-gray-900">
                      ৳{Number(p.price).toLocaleString()}
                    </td>
                    <td className="h-12 px-4 text-right text-gray-700">{p.stock}</td>
                    <td className="h-12 px-4">
                      {p.published ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="h-12 px-2 text-right">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Edit"
                      >
                        …
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">No products yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
