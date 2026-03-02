import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { OrdersTable } from "./OrdersTable";
import Link from "next/link";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");

  const { status, page, search: searchQuery } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const pageSize = 10;
  const search = searchQuery?.trim() || undefined;

  const where = {
    ...(status && status !== "all" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search } },
            { customer: { name: { contains: search } } },
            { customer: { email: { contains: search } } },
          ],
        }
      : {}),
  };

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [totalOrders, newOrders, completedOrders, cancelledOrders, orders, totalCount] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: oneYearAgo } } }),
    prisma.order.count({ where: { createdAt: { gte: oneYearAgo }, status: "pending" } }),
    prisma.order.count({ where: { status: "delivered", createdAt: { gte: oneYearAgo } } }),
    prisma.order.count({ where: { status: "cancelled", createdAt: { gte: oneYearAgo } } }),
    prisma.order.findMany({
      where,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { take: 1, include: { product: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[{ label: "Orders List" }]}
        title="Orders List"
        description="Here you can find all of your Orders"
        actions={
          <>
            <button
              type="button"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              More Actions
            </button>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
            >
              <span>+</span> Add Order
            </Link>
          </>
        }
      />
      <div className="p-6">
        <OrdersTable
          orders={orders}
          currentStatus={status ?? "all"}
          currentSearch={search ?? ""}
          summary={{ totalOrders, newOrders, completedOrders, cancelledOrders }}
          pagination={{ currentPage, totalPages, totalCount }}
        />
      </div>
    </div>
  );
}
