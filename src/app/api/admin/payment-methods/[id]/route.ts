import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["COD", "MANUAL"]).optional(),
  accountNumber: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal("")),
  sortOrder: z.number().int().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const body = await request.json();
  const data = updateSchema.parse(body);
  const updateData: {
    name?: string;
    type?: "COD" | "MANUAL";
    accountNumber?: string | null;
    instructions?: string | null;
    logoUrl?: string | null;
    sortOrder?: number;
  } = { ...data };
  if (updateData.logoUrl === "") updateData.logoUrl = null;
  const method = await prisma.paymentMethod.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(method);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  await prisma.paymentMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
