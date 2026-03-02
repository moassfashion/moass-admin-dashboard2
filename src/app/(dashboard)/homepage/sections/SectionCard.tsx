"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Section } from "@/types/homepage-sections";
import { SECTION_META } from "@/lib/homepage-sections";
import { Sparkles, TrendingUp, Star, Settings2 } from "lucide-react";

const iconMap = {
  Sparkles,
  TrendingUp,
  Star,
};

function getIcon(key: string) {
  const meta = SECTION_META[key as keyof typeof SECTION_META];
  const name = meta?.icon ?? "Star";
  return iconMap[name as keyof typeof iconMap] ?? Star;
}

export function SectionCard({
  section,
  onManage,
}: {
  section: Section;
  onManage: () => void;
}) {
  const meta = SECTION_META[section.key as keyof typeof SECTION_META];
  const title = section.title ?? meta?.title ?? section.key;
  const Icon = getIcon(section.key);
  const isHybrid = section.mode === "hybrid";
  const pinnedCount = section.pinned_count ?? 0;
  const maxItems = section.max_items ?? 8;
  const autoSlots = Math.max(0, maxItems - pinnedCount);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={section.mode === "auto" ? "default" : section.mode === "manual" ? "pending" : "accepted"}>
                {section.mode}
              </Badge>
              <span
                className={`text-xs font-medium ${
                  section.is_active ? "text-green-600" : "text-gray-500"
                }`}
              >
                {section.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-gray-500">
                {pinnedCount} pinned · max {maxItems}
              </span>
            </div>
            {isHybrid && (
              <div className="mt-2 flex h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${maxItems ? (pinnedCount / maxItems) * 100 : 0}%`,
                  }}
                />
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${maxItems ? (autoSlots / maxItems) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onManage}
          className="shrink-0"
        >
          <span className="inline-flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Manage
          </span>
        </Button>
      </CardBody>
    </Card>
  );
}
