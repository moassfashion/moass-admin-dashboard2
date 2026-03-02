import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

/**
 * GET – লগড-ইন কাস্টমারের একটি অর্ডার ডিটেইল (শুধু নিজের অর্ডার)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const customer = await getCurrentCustomer();
  if (!customer)
    return NextResponse.json({ error: "লগইন করা নেই।" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, customerId: customer.id },
    include: {
      items: { include: { product: true } },
    },
  });
  if (!order)
    return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });
  return NextResponse.json(order);
}
