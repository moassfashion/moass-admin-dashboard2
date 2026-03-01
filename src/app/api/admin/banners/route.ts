import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { z } from "zod";
import { bannerToJson } from "@/lib/banner";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const banners = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(banners.map(bannerToJson));
}

const createJsonSchema = z.object({
  title: z.string().optional(),
  image: z.string().min(1).optional(),
  link: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Image file required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please select an image file (JPEG, PNG, GIF, WebP)." },
        { status: 400 }
      );
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const title = (formData.get("title") as string)?.trim() || null;
    const link = (formData.get("link") as string)?.trim() || null;

    const banner = await prisma.banner.create({
      data: {
        title: title ?? undefined,
        image: null,
        imageData: buffer,
        imageMime: file.type || "image/jpeg",
        link: link ?? null,
      },
    });
    return NextResponse.json(bannerToJson(banner));
  }

  const body = await request.json();
  const data = createJsonSchema.parse(body);
  if (!data.image) {
    return NextResponse.json(
      { error: "Image URL required when using JSON. Or send multipart/form-data with file." },
      { status: 400 }
    );
  }
  const banner = await prisma.banner.create({
    data: {
      title: data.title,
      image: data.image,
      link: data.link ?? null,
      sortOrder: data.sortOrder,
      active: data.active,
    },
  });
  return NextResponse.json(bannerToJson(banner));
}
