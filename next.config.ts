import type { NextConfig } from "next";

// প্রোডে স্টোরফ্রন্ট ডোমেইন দিন (যেমন https://shop.yourstore.com); খালি থাকলে * (সব অরিজিন)
const storefrontOrigin = process.env.STOREFRONT_ORIGIN || "*";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/ecommerce/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: storefrontOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
