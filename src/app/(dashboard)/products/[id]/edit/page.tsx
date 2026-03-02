import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { ProductForm } from "./ProductForm";
import { getCategoriesForProductForm } from "@/lib/product-data";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, product, categories] = await Promise.all([
    getCurrentUser(),
    prisma.product.findUnique({
      where: { id },
      include: { categories: true },
    }),
    getCategoriesForProductForm(),
  ]);
  if (!user) redirect("/auth/v2/login");
  if (!product) notFound();
  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
      />
      <div className="p-6">
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
