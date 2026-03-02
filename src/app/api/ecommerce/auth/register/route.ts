import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createCustomerSession } from "@/lib/customer-auth";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = bodySchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing?.password)
      return NextResponse.json(
        { error: "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।" },
        { status: 400 }
      );
    const hashed = await hashPassword(password);
    let customer = existing;
    if (existing) {
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: { password: hashed, name: name ?? existing.name },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          name: name ?? null,
        },
      });
    }
    await createCustomerSession({ sub: customer.id, email: customer.email });
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
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: "ইমেইল ও পাসওয়ার্ড সঠিকভাবে দিন (পাসওয়ার্ড অন্তত ৬ অক্ষর)" },
        { status: 400 }
      );
    return NextResponse.json(
      { error: "রেজিস্ট্রেশন ব্যর্থ। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
