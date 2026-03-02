import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { HomepageSectionsClient } from "./HomepageSectionsClient";

export default async function HomepageSectionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[{ label: "Homepage", href: "/" }, { label: "Sections" }]}
        title="Homepage Sections Manager"
        description="Configure new arrivals, best selling, and featured sections. Set mode (auto / manual / hybrid), pin products, and reorder."
      />
      <div className="p-6">
        <HomepageSectionsClient />
      </div>
    </div>
  );
}
