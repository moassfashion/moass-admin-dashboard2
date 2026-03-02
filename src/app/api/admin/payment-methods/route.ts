import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { z } from "zod";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(methods);
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["COD", "MANUAL"]),
  accountNumber: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
});

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const body = await request.json();
  const data = createSchema.parse(body);
  const method = await prisma.paymentMethod.create({
    data: {
      name: data.name,
      type: data.type,
      isActive: true,
      accountNumber: data.accountNumber ?? null,
      instructions: data.instructions ?? null,
      logoUrl: data.logoUrl && data.logoUrl !== "" ? data.logoUrl : null,
      sortOrder: data.sortOrder,
    },
  });
  return NextResponse.json(method);
}
