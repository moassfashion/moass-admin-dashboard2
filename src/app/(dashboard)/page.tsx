import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardStats } from "./DashboardStats";
import { CombinedBudgetChart } from "./CombinedBudgetChart";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { DashboardDateFilter } from "./DashboardDateFilter";
import { ActionableInsights } from "./ActionableInsights";
import { TopCategoryList } from "./TopCategoryList";
import { TopCustomerList } from "./TopCustomerList";
import { getDateRangeFromSearch, formatDateRangeLabel } from "@/lib/dashboard-date";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");

  const params = await searchParams;
  const dateRange = getDateRangeFromSearch(params);
  const dateLabel = formatDateRangeLabel(dateRange);
  const { from, to } = dateRange;

  const lowStockSetting = await prisma.setting
    .findUnique({ where: { key: "low_stock_threshold" } })
    .catch(() => null);
  const lowStockThreshold = Math.max(0, parseInt(lowStockSetting?.value ?? "5", 10));

  const [
    totalOrders,
    totalRevenue,
    completedOrders,
    cancelledOrders,
    productCount,
    ordersForChart,
    recentOrders,
    inStockCount,
    outStockCount,
    pendingOrdersCount,
    lowStockCount,
    ordersForAov,
    topProductsRaw,
    orderItemsForCategories,
    ordersForTopCustomers,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }).catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: from, lte: to } } }).catch(() => ({ _sum: { total: null } })),
    prisma.order.count({ where: { status: "delivered", createdAt: { gte: from, lte: to } } }).catch(() => 0),
    prisma.order.count({ where: { status: "cancelled", createdAt: { gte: from, lte: to } } }).catch(() => 0),
    prisma.product.count().catch(() => 0),
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { total: true, createdAt: true },
    }).catch(() => []),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { take: 1, include: { product: true } } },
    }).catch(() => []),
    prisma.product.count({ where: { stock: { gt: 0 }, published: true } }).catch(() => 0),
    prisma.product.count({ where: { OR: [{ stock: 0 }, { published: false }] } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["pending", "shipped"] }, createdAt: { gte: from, lte: to } } }).catch(() => 0),
    prisma.product.count({ where: { stock: { lte: lowStockThreshold }, published: true } }).catch(() => 0),
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { total: true },
    }).catch(() => []),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: { order: { createdAt: { gte: from, lte: to } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }).catch(() => []),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: from, lte: to } } },
      select: {
        quantity: true,
        price: true,
        productId: true,
        orderId: true,
        product: {
          select: { categories: { take: 1, select: { id: true, name: true } } },
        },
      },
    }).catch(() => []),
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, customerId: { not: null } },
      select: { customerId: true, total: true },
    }).catch(() => []),
  ]);

  const revenue = Number(totalRevenue._sum?.total ?? 0);
  const orderCountForAov = ordersForAov.length;
  const aov = orderCountForAov > 0 ? revenue / orderCountForAov : 0;

  const productIds = topProductsRaw.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  }).catch(() => []);
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const topProducts = topProductsRaw.map((i) => ({
    id: i.productId,
    name: productMap[i.productId]?.name ?? "Unknown",
    quantity: i._sum.quantity ?? 0,
  }));

  const categoryMap = new Map<string, { name: string; revenue: number; orderIds: Set<string> }>();
  for (const item of orderItemsForCategories) {
    const firstCat = item.product?.categories?.[0];
    const categoryId = firstCat?.id ?? "uncategorized";
    const name = firstCat?.name ?? "Uncategorized";
    const lineTotal = Number(item.price) * item.quantity;
    const existing = categoryMap.get(categoryId);
    if (existing) {
      existing.revenue += lineTotal;
      existing.orderIds.add(item.orderId);
    } else {
      const orderIds = new Set<string>();
      orderIds.add(item.orderId);
      categoryMap.set(categoryId, { name, revenue: lineTotal, orderIds });
    }
  }
  const topCategoriesWithOrders = Array.from(categoryMap.entries())
    .map(([id, v]) => ({
      id,
      name: v.name,
      revenue: Math.round(v.revenue),
      orderCount: v.orderIds.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const customerTotals = new Map<string, { totalSpent: number; orderCount: number }>();
  for (const o of ordersForTopCustomers) {
    const cid = o.customerId!;
    const total = Number(o.total);
    const cur = customerTotals.get(cid) ?? { totalSpent: 0, orderCount: 0 };
    cur.totalSpent += total;
    cur.orderCount += 1;
    customerTotals.set(cid, cur);
  }
  const topCustomerIds = Array.from(customerTotals.entries())
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
    .slice(0, 5)
    .map(([id]) => id);
  const customers = await prisma.customer.findMany({
    where: { id: { in: topCustomerIds } },
    select: { id: true, name: true, email: true },
  }).catch(() => []);
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));
  const topCustomers = topCustomerIds.map((id) => {
    const stats = customerTotals.get(id)!;
    const c = customerMap[id];
    return {
      id,
      name: c?.name ?? null,
      email: c?.email ?? "",
      totalSpent: Math.round(stats.totalSpent),
      orderCount: stats.orderCount,
    };
  });

  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Welcome Back!"
        description="Some explanation here on dashboard overview"
        actions={
          <Suspense fallback={<div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />}>
            <DashboardDateFilter
              range={params.range}
              from={params.from}
              to={params.to}
              dateLabel={dateLabel}
            />
          </Suspense>
        }
      />
      <div className="space-y-6 p-6">
        <DashboardStats
          totalRevenue={revenue}
          productSales={totalOrders}
          completedOrder={completedOrders}
          cancelledOrder={cancelledOrders}
          dateLabel={dateLabel}
        />
        <ActionableInsights
          pendingOrders={pendingOrdersCount}
          lowStockCount={lowStockCount}
          topProducts={topProducts}
          aov={aov}
          dateLabel={dateLabel}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <CombinedBudgetChart orders={ordersForChart} dateLabel={dateLabel} />
          <AnalyticsPanel
            inStockCount={inStockCount}
            outStockCount={outStockCount}
            totalProducts={productCount}
            totalOrders={totalOrders}
            dateLabel={dateLabel}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TopCategoryList categories={topCategoriesWithOrders} dateLabel={dateLabel} />
          <TopCustomerList customers={topCustomers} dateLabel={dateLabel} />
        </div>
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  );
}
