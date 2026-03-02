import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  const setting = await prisma.setting.findUnique({ where: { key: "low_stock_threshold" } });
  const threshold = parseInt(setting?.value ?? "5", 10);
  const lowStock = await prisma.product.findMany({
    where: { stock: { lte: threshold }, published: true },
    orderBy: { stock: "asc" },
    include: { categories: true },
  });
  return (
    <div className="min-h-full">
      <TopBar breadcrumbs={[{ label: "Inventory" }]} />
      <div className="p-6">
        <p className="mb-4 text-sm text-gray-500">Low stock threshold: {threshold} (change in Settings)</p>
        <InventoryClient lowStock={lowStock} />
      </div>
    </div>
  );
}
