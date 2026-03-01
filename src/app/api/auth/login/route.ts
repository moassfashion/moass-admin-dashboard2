import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = bodySchema.parse(body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password)))
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    await createSession({ sub: user.id, email: user.email });
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    console.error("Login error:", e);
    const err = e instanceof Error ? e : new Error(String(e));
    const msg = err.message || "";
    const isDbError = msg.includes("Can't reach database") || msg.includes("connect") || msg.includes("Unknown table");
    const isAuthSecret = msg.includes("AUTH_SECRET");
    let message = "Login failed";
    if (isDbError)
      message = "Database not reachable. Check DATABASE_URL and that tables exist.";
    else if (isAuthSecret)
      message = "Server config error. Set AUTH_SECRET in Vercel environment variables.";
    else if (process.env.NODE_ENV === "development")
      message = msg;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
