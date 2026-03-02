import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

/**
 * GET – লগড-ইন কাস্টমারের পয়েন্ট ও রিওয়ার্ড হিস্ট্রি (ড্যাশবোর্ডে দেখানোর জন্য)
 */
export async function GET(request: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer)
    return NextResponse.json({ error: "লগইন করা নেই।" }, { status: 401 });

  const rewards = await prisma.customerReward.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const c = await prisma.customer.findUnique({
    where: { id: customer.id },
    select: { points: true },
  });

  return NextResponse.json({
    points: c?.points ?? 0,
    rewards,
  });
}
