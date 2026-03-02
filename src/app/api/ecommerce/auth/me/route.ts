import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer)
    return NextResponse.json({ error: "লগইন করা নেই।" }, { status: 401 });
  return NextResponse.json({
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      points: customer.points,
    },
  });
}
