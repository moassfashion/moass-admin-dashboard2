import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const current = await prisma.paymentMethod.findUniqueOrThrow({ where: { id } });
  const method = await prisma.paymentMethod.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  return NextResponse.json(method);
}
