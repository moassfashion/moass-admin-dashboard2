import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const createOrderSchema = z.object({
  customer: z
    .object({
      email: z.string().email(),
      name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  items: z.array(
    z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) })
  ),
  couponCode: z.string().optional(),
  shippingZoneId: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  payment_method_id: z.string().min(1).optional(),
  transaction_id: z.string().nullable().optional(),
  sender_number: z.string().nullable().optional(),
});

/**
 * Public API for storefront – create order.
 * If customer is logged in (ecom_customer_session), uses their saved profile/address.
 * Otherwise requires customer object in body (guest checkout).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createOrderSchema.parse(body);
    if (data.items.length === 0)
      return NextResponse.json({ error: "At least one item required" }, { status: 400 });

    let paymentMethodId: string | null = null;
    let transactionId: string | null = null;
    let senderNumber: string | null = null;
    if (data.payment_method_id) {
      const method = await prisma.paymentMethod.findFirst({
        where: { id: data.payment_method_id, isActive: true },
      });
      if (!method)
        return NextResponse.json(
          { error: "Invalid or inactive payment method" },
          { status: 400 }
        );
      paymentMethodId = method.id;
      if (method.type === "MANUAL") {
        const txId = (data.transaction_id ?? "").toString().trim();
        if (!txId)
          return NextResponse.json(
            { error: "Transaction ID is required for this payment method" },
            { status: 422 }
          );
        transactionId = txId;
      }
      senderNumber = data.sender_number != null && String(data.sender_number).trim() !== ""
        ? String(data.sender_number).trim()
        : null;
    }

    const loggedIn = await getCurrentCustomer();
    let customerPayload: { email: string; name?: string; phone?: string; address?: string };
    let customerId: string | null = null;
    let customer: { id: string; email: string; name: string | null; phone: string | null; address: string | null };

    if (loggedIn) {
      customerPayload = {
        email: loggedIn.email,
        name: loggedIn.name ?? undefined,
        phone: loggedIn.phone ?? undefined,
        address: loggedIn.address ?? undefined,
      };
      if (data.customer) {
        customerPayload.name = data.customer.name ?? customerPayload.name;
        customerPayload.phone = data.customer.phone ?? customerPayload.phone;
        customerPayload.address = data.customer.address ?? customerPayload.address;
      }
      customer = await prisma.customer.findUniqueOrThrow({ where: { id: loggedIn.id } });
      customerId = customer.id;
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerPayload.name ?? customer.name,
          phone: customerPayload.phone ?? customer.phone,
          address: customerPayload.address ?? customer.address,
        },
      });
    } else {
      if (!data.customer?.email)
        return NextResponse.json(
          { error: "লগইন করুন অথবা ইমেইল ও ঠিকানা দিন।" },
          { status: 400 }
        );
      customerPayload = data.customer;
    }

    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, published: true },
    });
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: "Invalid or unpublished product", productIds: missing },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity)
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}`, productId: product.id },
          { status: 400 }
        );
      const price = Number(product.price);
      subtotal += price * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, price });
    }

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode?.trim()) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: data.couponCode.toUpperCase().trim(), active: true },
      });
      if (coupon) {
        const now = new Date();
        if (coupon.startsAt && now < coupon.startsAt)
          return NextResponse.json({ error: "Coupon not yet valid" }, { status: 400 });
        if (coupon.endsAt && now > coupon.endsAt)
          return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
        if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
          return NextResponse.json({ error: "Coupon limit reached" }, { status: 400 });
        const min = Number(coupon.minOrder ?? 0);
        if (subtotal < min)
          return NextResponse.json(
            { error: `Minimum order ${min} required` },
            { status: 400 }
          );
        const val = Number(coupon.value);
        discount =
          coupon.type === "percent" ? (subtotal * val) / 100 : Math.min(val, subtotal);
        discount = Math.round(discount * 100) / 100;
        couponCode = coupon.code;
      }
    }

    let shippingCost = 0;
    let shippingZoneName: string | null = null;
    if (data.shippingZoneId) {
      const zone = await prisma.shippingZone.findUnique({
        where: { id: data.shippingZoneId },
      });
      if (zone) {
        shippingCost = Number(zone.price);
        shippingZoneName = zone.name;
      }
    }

    const tax = 0;
    const total = Math.max(0, subtotal - discount + shippingCost + tax);

    if (!loggedIn) {
      const normalizedEmail = customerPayload.email.trim().toLowerCase();
      let guestCustomer = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
      });
      if (guestCustomer) {
        customerId = guestCustomer.id;
        await prisma.customer.update({
          where: { id: guestCustomer.id },
          data: {
            name: customerPayload.name ?? guestCustomer.name,
            phone: customerPayload.phone ?? guestCustomer.phone,
            address: customerPayload.address ?? guestCustomer.address,
          },
        });
      } else {
        guestCustomer = await prisma.customer.create({
          data: {
            email: normalizedEmail,
            name: customerPayload.name ?? null,
            phone: customerPayload.phone ?? null,
            address: customerPayload.address ?? null,
          },
        });
        customerId = guestCustomer.id;
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const nextRow = await tx.$queryRaw<[{ next: bigint }]>`
        SELECT COALESCE(MAX(CAST(orderNumber AS UNSIGNED)), 0) + 1 AS \`next\`
        FROM \`Order\`
        WHERE orderNumber REGEXP '^[0-9]+$'
      `;
      const orderNumber = String(Number(nextRow[0].next)).padStart(5, "0");

      const o = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          paymentMethodId,
          transactionId,
          senderNumber,
          status: "pending",
          subtotal: new Decimal(subtotal),
          shipping: new Decimal(shippingCost),
          tax: new Decimal(tax),
          total: new Decimal(total),
          couponCode,
          shippingZone: shippingZoneName,
          shippingAddr: data.shippingAddress ?? customerPayload.address ?? null,
          notes: data.notes ?? null,
        },
      });
      for (const it of orderItems) {
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            productId: it.productId,
            quantity: it.quantity,
            price: new Decimal(it.price),
          },
        });
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }
      if (couponCode) {
        await tx.coupon.updateMany({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }
      return o;
    });

    if (loggedIn && customerId) {
      const pointsToAdd = Math.floor(total / 100);
      if (pointsToAdd > 0) {
        await prisma.customerReward.create({
          data: {
            customerId,
            points: pointsToAdd,
            reason: `অর্ডার #${orderNumber}`,
            orderId: order.id,
          },
        });
        await prisma.customer.update({
          where: { id: customerId },
          data: { points: { increment: pointsToAdd } },
        });
      }
    }

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        paymentMethod: true,
        items: { include: { product: true } },
      },
    });
    return NextResponse.json(full);
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: "Validation failed", details: e.flatten() }, { status: 400 });
    throw e;
  }
}
