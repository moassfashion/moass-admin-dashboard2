import type { Banner } from "@prisma/client";

/**
 * Banner with image as URL: use /api/banner-image/[id] when imageData is stored in DB.
 * Excludes imageData from serialization.
 */
export function bannerToJson(banner: Banner) {
  const { imageData, imageMime, ...rest } = banner;
  const image =
    imageData != null && imageData.length > 0
      ? `/api/banner-image/${banner.id}`
      : (banner.image ?? "");
  return { ...rest, image };
}
