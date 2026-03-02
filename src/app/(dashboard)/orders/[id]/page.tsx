import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import { TopBar } from "@/components/layout/TopBar";
import { OrderEditForm } from "./OrderEditForm";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/v2/login");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!order) notFound();

  const showBanner = !!order.notes?.trim();
  const hasCoupon = !!order.couponCode?.trim();
  const discountAmount =
    hasCoupon
      ? Math.max(
          0,
          Number(order.subtotal) + Number(order.shipping) - Number(order.total)
        )
      : 0;

  return (
    <div className="min-h-full">
      <TopBar
        breadcrumbs={[
          { label: "Orders", href: "/orders" },
          { label: `Order #${order.orderNumber}` },
        ]}
      />
      <div className="p-6">
        {showBanner && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 border-l-4 border-l-blue-500 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span className="font-medium">Order has notes</span>
            <span className="text-blue-600">{order.notes}</span>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="text-sm font-medium text-gray-900">Order details</div>
              </div>
              <div className="px-6 py-4">
                <OrderEditForm order={order} />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="text-sm font-medium text-gray-900">Items</div>
              </div>
              <div className="overflow-x-auto px-6 py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      <th className="h-10 px-4 text-left">Product</th>
                      <th className="h-10 px-4 text-right">Qty</th>
                      <th className="h-10 px-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((i) => (
                      <tr key={i.id} className="border-b border-gray-100">
                        <td className="flex h-14 items-center gap-3 px-4 py-2">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100" />
                          <span className="text-gray-900">{i.product.name}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700">{i.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          ৳{Number(i.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 space-y-1 border-t border-gray-200 pt-4 text-right text-sm">
                  <p className="text-gray-700">
                    Subtotal <span className="font-medium text-gray-900">৳{Number(order.subtotal).toLocaleString()}</span>
                  </p>
                  <p className="text-gray-700">
                    Shipping <span className="font-medium text-gray-900">৳{Number(order.shipping).toLocaleString()}</span>
                  </p>
                  {hasCoupon && discountAmount > 0 && (
                    <p className="text-green-600">
                      Coupon ({order.couponCode}) <span className="font-medium text-green-700">-৳{discountAmount.toLocaleString()}</span>
                    </p>
                  )}
                  <p className="border-t border-gray-200 pt-2 text-base font-medium text-gray-900">
                    Total ৳{Number(order.total).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="text-sm font-medium text-gray-900">Customer</div>
              </div>
              <div className="px-6 py-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900">{order.customer?.name ?? order.customer?.email ?? "—"}</p>
                {order.customer?.email && (
                  <p className="mt-1 text-gray-600">{order.customer.email}</p>
                )}
              </div>
            </div>
            {order.shippingAddr && (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">Shipping address</div>
                </div>
                <div className="px-6 py-4 text-sm text-gray-700">{order.shippingAddr}</div>
              </div>
            )}
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="text-sm font-medium text-gray-900">Payment summary</div>
              </div>
              <div className="px-6 py-4 text-sm text-gray-700">
                <p>Subtotal ৳{Number(order.subtotal).toLocaleString()}</p>
                <p className="mt-1">Shipping ৳{Number(order.shipping).toLocaleString()}</p>
                {hasCoupon && discountAmount > 0 && (
                  <p className="mt-1 text-green-600">
                    Coupon ({order.couponCode}) -৳{discountAmount.toLocaleString()}
                  </p>
                )}
                <p className="mt-2 border-t border-gray-100 pt-2 font-medium text-gray-900">
                  Total ৳{Number(order.total).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
