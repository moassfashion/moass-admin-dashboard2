import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

/**
 * GET – লগড-ইন কাস্টমারের অর্ডার লিস্ট (ড্যাশবোর্ডে দেখানোর জন্য)
 * Query: page, limit
 */
export async function GET(request: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer)
    return NextResponse.json({ error: "লগইন করা নেই।" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { customerId: customer.id } }),
  ]);

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
  });
}
