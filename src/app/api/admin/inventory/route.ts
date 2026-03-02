import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const setting = await prisma.setting.findUnique({
    where: { key: "low_stock_threshold" },
  });
  const threshold = parseInt(setting?.value ?? "5", 10);
  const lowStock = await prisma.product.findMany({
    where: { stock: { lte: threshold }, published: true },
    orderBy: { stock: "asc" },
    include: { categories: true },
  });
  return NextResponse.json({ lowStock, threshold });
}
