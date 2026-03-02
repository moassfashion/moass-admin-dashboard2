import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Upload image: store in MySQL (StoredImage) when DB is available.
 * Falls back to public/uploads only in local dev when DB write fails (e.g. table missing).
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || "image/jpeg";

  // Prefer MySQL (StoredImage) so images work on Vercel without Blob
  try {
    const row = await prisma.storedImage.create({
      data: { data: buffer, mimeType },
    });
    const url = `/api/image/${row.id}`;
    return NextResponse.json({ url });
  } catch (dbErr) {
    // If StoredImage table doesn't exist yet, fallback to disk only in dev
    if (process.env.VERCEL) {
      const msg =
        dbErr instanceof Error ? dbErr.message : "Upload failed";
      console.error("[upload] DB error:", dbErr);
      return NextResponse.json(
        {
          error:
            "Image upload failed. Ensure StoredImage table exists (run migration or hostinger-create-tables.sql).",
        },
        { status: 500 }
      );
    }
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      const ext = path.extname(file.name) || ".bin";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const filePath = path.join(UPLOAD_DIR, name);
      await writeFile(filePath, buffer);
      return NextResponse.json({ url: `/uploads/${name}` });
    } catch (fsErr) {
      const message = fsErr instanceof Error ? fsErr.message : "Upload failed";
      console.error("[upload] Error:", fsErr);
      return NextResponse.json(
        { error: process.env.NODE_ENV === "development" ? message : "Upload failed" },
        { status: 500 }
      );
    }
  }
}
