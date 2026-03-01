import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bannerToJson } from "@/lib/banner";

/**
 * Public API for storefront – active banners only.
 * No auth required.
 */
export async function GET() {
  const rows = await prisma.banner.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  const banners = rows.map(bannerToJson);
  return NextResponse.json(banners);
}
