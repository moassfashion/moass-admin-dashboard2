import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { PaymentMethodsClient } from "./PaymentMethodsClient";

export default async function PaymentMethodsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="min-h-full">
      <TopBar breadcrumbs={[{ label: "Payment Methods" }]} />
      <div className="p-6">
        <PaymentMethodsClient initialMethods={methods} />
      </div>
    </div>
  );
}
