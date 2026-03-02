import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { z } from "zod";

const bodySchema = z.object({ stock: z.number().int().min(0) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const body = await request.json();
  const { stock } = bodySchema.parse(body);
  const product = await prisma.product.update({
    where: { id },
    data: { stock },
    include: { categories: true },
  });
  return NextResponse.json(product);
}
