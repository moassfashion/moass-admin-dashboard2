import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createCustomerSession } from "@/lib/customer-auth";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = bodySchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });
    if (!customer?.password || !(await verifyPassword(password, customer.password)))
      return NextResponse.json(
        { error: "ইমেইল বা পাসওয়ার্ড ভুল।" },
        { status: 401 }
      );
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
      return NextResponse.json({ error: "ইমেইল ও পাসওয়ার্ড দিন।" }, { status: 400 });
    return NextResponse.json(
      { error: "লগইন ব্যর্থ। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
