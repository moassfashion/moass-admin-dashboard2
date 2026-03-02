import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

function isNextRedirect(err: unknown): boolean {
  return !!(
    err &&
    typeof err === "object" &&
    "digest" in err &&
    String((err as { digest?: string }).digest).startsWith("NEXT_")
  );
}

const getLowStockCount = unstable_cache(
  async () => {
    const setting = await prisma.setting
      .findUnique({ where: { key: "low_stock_threshold" } })
      .catch(() => null);
    const threshold = parseInt(setting?.value ?? "5", 10);
    return prisma.product
      .count({ where: { stock: { lte: threshold }, published: true } })
      .catch(() => 0);
  },
  ["dashboard-low-stock-count"],
  { revalidate: 30 }
);

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  try {
    const [user, lowStockCount] = await Promise.all([
      getCurrentUser(),
      getLowStockCount(),
    ]);
    if (!user) redirect("/auth/v2/login");
    return (
      <QueryProvider>
        <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
          <Sidebar userName={user?.name ?? user?.email} lowStockCount={lowStockCount} />
          <main className="ml-60 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </QueryProvider>
    );
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    console.error("Dashboard layout error:", err);
    redirect("/auth/v2/login?error=session");
  }
}
