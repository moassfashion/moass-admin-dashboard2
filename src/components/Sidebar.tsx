"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Image,
  Users,
  Ticket,
  Warehouse,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  User,
  LogOut,
  LayoutGrid,
  LayoutList,
  Search,
  List,
} from "lucide-react";

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/v2/login";
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-150 ease-in-out hover:bg-gray-50 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Log out
    </button>
  );
}

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/banners", label: "Banners", icon: Image },
  { href: "/homepage/sections", label: "Homepage Sections", icon: LayoutList },
  { href: "/menus", label: "Menus", icon: List },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/coupons", label: "Coupons", icon: Ticket },
  { href: "/inventory", label: "Inventory", icon: Warehouse, badgeKey: "lowStock" },
  { href: "/shipping", label: "Shipping", icon: Truck },
  { href: "/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  userName,
  lowStockCount = 0,
}: {
  userName?: string | null;
  lowStockCount?: number;
}) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNav = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mainNav;
    return mainNav.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-100 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-white">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium tracking-tight text-gray-900">
          MOASS Admin
        </span>
      </div>

      <div className="mt-3 px-3">
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            aria-label="Search menu"
          />
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          Main
        </p>
        {filteredNav.map(({ href, label, icon: Icon, badgeKey }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          const showBadge = badgeKey === "lowStock" && lowStockCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ease-in-out ${
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                  {lowStockCount}
                </span>
              )}
            </Link>
          );
        })}
        {filteredNav.length === 0 && (
          <p className="px-3 py-2 text-sm text-gray-500">No menu match</p>
        )}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          Account
        </p>
        <Link
          href="/account"
          className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ease-in-out ${
            pathname === "/account"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <User className="h-4 w-4 shrink-0" />
          Account
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
