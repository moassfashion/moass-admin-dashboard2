import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public route: serve image from MySQL (StoredImage).
 * Used for product images etc. uploaded via /api/upload.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = await prisma.storedImage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!row) {
    return new NextResponse(null, { status: 404 });
  }
  const mime = row.mimeType || "image/jpeg";
  return new NextResponse(row.data, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
