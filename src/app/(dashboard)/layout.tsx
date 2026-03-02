import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  const setting = await prisma.setting.findUnique({ where: { key: "low_stock_threshold" } }).catch(() => null);
  const threshold = parseInt(setting?.value ?? "5", 10);
  const lowStockCount = await prisma.product.count({ where: { stock: { lte: threshold }, published: true } }).catch(() => 0);
  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      <Sidebar userName={user?.name ?? user?.email} lowStockCount={lowStockCount} />
      <main className="ml-60 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
