import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { ReportsCharts } from "./ReportsCharts";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  const days = 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  const [ordersForChart, items] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { categories: true },
  });
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const topProducts = items.map((i) => ({
    product: byId[i.productId],
    quantity: i._sum.quantity ?? 0,
  }));
  return (
    <div className="min-h-full">
      <TopBar breadcrumbs={[{ label: "Reports" }]} />
      <div className="p-6">
        <ReportsCharts orders={ordersForChart} days={days} topProducts={topProducts} />
      </div>
    </div>
  );
}
