import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { parseSectionConfig, HOMEPAGE_SECTION_KEYS } from "@/lib/homepage-sections";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  for (const key of HOMEPAGE_SECTION_KEYS) {
    await prisma.homepageSection.upsert({
      where: { key },
      create: {
        key,
        type: "auto",
        title: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        sortOrder: HOMEPAGE_SECTION_KEYS.indexOf(key),
      },
      update: {},
    });
  }

  const rows = await prisma.homepageSection.findMany({
    where: { key: { in: [...HOMEPAGE_SECTION_KEYS] } },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  const sections = rows.map((row) => {
    const config = parseSectionConfig(row.config);
    return {
      id: row.id,
      key: row.key,
      title: row.title ?? undefined,
      mode: config.mode,
      is_active: config.is_active,
      pinned_count: config.pinned_product_ids.length,
      max_items: config.max_items,
      auto_days: config.auto_days,
      auto_category: config.auto_category,
      config,
    };
  });

  return NextResponse.json({ sections });
}
