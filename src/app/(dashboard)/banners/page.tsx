import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { bannerToJson } from "@/lib/banner";
import { TopBar } from "@/components/layout/TopBar";
import { BannersClient } from "./BannersClient";

export default async function BannersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  const rows = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const banners = rows.map(bannerToJson);
  return (
    <div className="min-h-full">
      <TopBar breadcrumbs={[{ label: "Banners" }]} />
      <div className="p-6">
        <BannersClient initialBanners={banners} />
      </div>
    </div>
  );
}
