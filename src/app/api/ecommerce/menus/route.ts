import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { menuGroupToJson } from "@/lib/menu";

/**
 * Public API for storefront – footer/header menu groups with items.
 * No auth required.
 * Query: ?placement=footer | ?placement=header to filter.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement");
  const where = placement === "footer" || placement === "header"
    ? { placement }
    : {};
  const groups = await prisma.menuGroup.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  const menus = groups.map(menuGroupToJson);
  return NextResponse.json(menus);
}
