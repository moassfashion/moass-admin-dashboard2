import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/v2/login",
  "/auth/v2/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/validate",
  "/api/upload",
];

const CORS_PATHS = ["/api/ecommerce", "/api/image", "/api/banner-image"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.STOREFRONT_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const localhost = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];
  return [...new Set([...fromEnv, ...localhost])];
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const allowOrigin =
    origin && allowed.includes(origin) ? origin : allowed[0] || "*";
  const credentials = allowOrigin !== "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...(credentials ? { "Access-Control-Allow-Credentials": "true" } : {}),
  };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS for storefront API (localhost + STOREFRONT_ORIGIN)
  const isCorsPath = CORS_PATHS.some((p) => pathname.startsWith(p));
  if (isCorsPath) {
    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          ...corsHeaders(origin),
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    const res = NextResponse.next();
    Object.entries(corsHeaders(origin)).forEach(([k, v]) =>
      res.headers.set(k, v)
    );
    return res;
  }

  // Auth guard for dashboard pages
  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get("ecomdash_session")?.value;
  if (!token) {
    const login = new URL("/auth/v2/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/ecommerce/:path*",
    "/api/image/:path*",
    "/api/banner-image/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
