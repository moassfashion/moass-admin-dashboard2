import type { NextConfig } from "next";

// স্টোরফ্রন্ট থেকে credentials (কুকি) সহ রিকোয়েস্ট চালাতে হলে নির্দিষ্ট অরিজিন দিন।
// উদাহরণ: https://your-store.vercel.app বা লোকাল: http://localhost:3001
// * দিলে ব্রাউজার credentials পাঠাতে দেবে না (CORS নিয়ম)।
const storefrontOrigin = process.env.STOREFRONT_ORIGIN || "";
const allowOrigin = storefrontOrigin || "*";
const allowCredentials = !!storefrontOrigin; // শুধু নির্দিষ্ট অরিজিন থাকলে credentials

const nextConfig: NextConfig = {
  async headers() {
    const ecommerceHeaders = [
      { key: "Access-Control-Allow-Origin", value: allowOrigin },
      { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type" },
      ...(allowCredentials
        ? [{ key: "Access-Control-Allow-Credentials", value: "true" }]
        : []),
    ];
    const imageHeaders = [
      { key: "Access-Control-Allow-Origin", value: allowOrigin },
      { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
      ...(allowCredentials
        ? [{ key: "Access-Control-Allow-Credentials", value: "true" }]
        : []),
    ];
    return [
      { source: "/api/ecommerce/:path*", headers: ecommerceHeaders },
      { source: "/api/image/:path*", headers: imageHeaders },
      { source: "/api/banner-image/:path*", headers: imageHeaders },
    ];
  },
};

export default nextConfig;
