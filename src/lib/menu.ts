import type { MenuGroup as PrismaMenuGroup, MenuItem as PrismaMenuItem } from "@prisma/client";

export type MenuGroupJson = {
  id: string;
  key: string;
  label: string;
  placement: string;
  sortOrder: number;
  items?: MenuItemJson[];
};

export type MenuItemJson = {
  id: string;
  menuGroupId: string;
  label: string;
  link: string;
  sortOrder: number;
};

export function menuItemToJson(item: PrismaMenuItem): MenuItemJson {
  return {
    id: item.id,
    menuGroupId: item.menuGroupId,
    label: item.label,
    link: item.link,
    sortOrder: item.sortOrder,
  };
}

export function menuGroupToJson(
  group: PrismaMenuGroup & { items?: PrismaMenuItem[] }
): MenuGroupJson {
  return {
    id: group.id,
    key: group.key,
    label: group.label,
    placement: group.placement,
    sortOrder: group.sortOrder,
    items: group.items?.map(menuItemToJson).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
