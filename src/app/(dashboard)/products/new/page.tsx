import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProductForm } from "../[id]/edit/ProductForm";
import { getCategoriesForProductForm } from "@/lib/product-data";

export default async function NewProductPage() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getCategoriesForProductForm(),
  ]);
  if (!user) redirect("/auth/v2/login");
  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[
          { label: "Products", href: "/products" },
          { label: "Add New Product" },
        ]}
        title="Add New Product"
        description="Add a new product to your store"
      />
      <div className="p-6">
        <ProductForm categories={categories} product={null} />
      </div>
    </div>
  );
}
