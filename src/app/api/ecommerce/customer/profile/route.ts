import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

/** GET – লগড-ইন কাস্টমারের প্রোফাইল (নাম, ফোন, ঠিকানা সেভ থাকলে দেখাবে) */
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

/** PATCH – ঠিকানা/নাম/ফোন আপডেট (একবার সেভ করলে থেকে যাবে, অর্ডার时 দেখাবে) */
export async function PATCH(request: NextRequest) {
  const customer = await getCurrentCustomer();
  if (!customer)
    return NextResponse.json({ error: "লগইন করা নেই।" }, { status: 401 });
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(data.name !== undefined && { name: data.name || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
      },
    });
    return NextResponse.json({
      customer: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        address: updated.address,
        points: updated.points,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    return NextResponse.json({ error: "আপডেট ব্যর্থ।" }, { status: 500 });
  }
}
