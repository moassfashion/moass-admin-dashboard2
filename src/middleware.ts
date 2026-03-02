import { NextRequest, NextResponse } from "next/server";

const CORS_PATHS = ["/api/ecommerce", "/api/image", "/api/banner-image"];

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
  const combined = [...new Set([...fromEnv, ...localhost])];
  return combined;
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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isCorsPath = CORS_PATHS.some((p) => pathname.startsWith(p));
  if (!isCorsPath) return NextResponse.next();

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

export const config = {
  matcher: [
    "/api/ecommerce/:path*",
    "/api/image/:path*",
    "/api/banner-image/:path*",
  ],
};
