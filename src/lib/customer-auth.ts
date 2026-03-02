import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "ecom_customer_session";
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret === "change-me"))
    throw new Error("AUTH_SECRET must be set and not default in production");
  return new TextEncoder().encode(secret || "dev-secret-change-in-production");
}

export async function createCustomerSession(payload: { sub: string; email: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DEFAULT_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEFAULT_MAX_AGE,
    path: "/",
  });
}

export async function deleteCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCustomerSession(): Promise<{ sub: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.email) return null;
    return { sub: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}

/** Cached per-request. Returns logged-in customer or null. */
export const getCurrentCustomer = cache(async () => {
  try {
    const session = await getCustomerSession();
    if (!session) return null;
    const customer = await prisma.customer.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        points: true,
      },
    });
    return customer;
  } catch {
    return null;
  }
});
