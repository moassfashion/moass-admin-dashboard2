import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public route: serve banner image from MySQL (imageData).
 * Used when banner has imageData stored in DB instead of external URL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { imageData: true, imageMime: true },
  });
  if (!banner?.imageData) {
    return new NextResponse(null, { status: 404 });
  }
  const mime = banner.imageMime ?? "image/jpeg";
  return new NextResponse(banner.imageData, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
