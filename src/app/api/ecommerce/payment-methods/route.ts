import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public storefront API – list active payment methods sorted by sort_order.
 * No auth required. Used on checkout to show payment options.
 */
export async function GET() {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      instructions: true,
      accountNumber: true,
      logoUrl: true,
    },
  });
  const payment_methods = methods.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    instructions: m.instructions,
    account_number: m.accountNumber,
    logo_url: m.logoUrl,
  }));
  return NextResponse.json({ payment_methods });
}
