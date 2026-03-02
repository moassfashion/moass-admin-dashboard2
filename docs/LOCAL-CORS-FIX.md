# Local থেকে অর্ডার / API কল – CORS ফিক্স

স্টোরফ্রন্ট যখন **localhost** (যেমন `http://localhost:3000` বা `3001`) থেকে চলে এবং API **ভেরসেল/প্রোড** (যেমন `https://moass-admin-dashboard.vercel.app`) এ থাকে, ব্রাউজার একে **cross-origin request** হিসেবে দেখে। অ্যাডমিন ড্যাশবোর্ড যদি localhost কে অলাউ না করে, তাহলে ব্রাউজার রিকোয়েস্ট ব্লক করে – তাই অর্ডার প্লেস হয় না বা API কল ফেইল হয়।

এই ডকুমেন্টে ধাপে ধাপে লিখে দেওয়া আছে: **অ্যাডমিন ড্যাশবোর্ড প্রজেক্টে** CORS কীভাবে সেট করবেন।

---

## এই প্রজেক্টে (MOASS Admin Dashboard – Next.js / Vercel)

এই রিপোতে **ইতিমধ্যে CORS লজিক** আছে (`src/proxy.ts` এ)। এটি নিচের অরিজিনগুলো অটোমেটিক অলাউ করে:

- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- এবং env ভেরিয়েবল **`STOREFRONT_ORIGIN`** এ যে মান দেওয়া আছে (এক বা একাধিক, কমা দিয়ে আলাদা)

### আপনার করণীয়

1. **ভেরসেলে ডিপ্লয় করা অ্যাডমিন অ্যাপে** env চেক করুন:
   - Vercel Dashboard → প্রজেক্ট → Settings → Environment Variables
   - **`STOREFRONT_ORIGIN`** থাকলে সেখানে প্রোড স্টোর URL দিন (যেমন `https://your-store.vercel.app`)
   - লোকাল ডেভের জন্য **কিছু করার দরকার নেই** – মিডলওয়্যার localhost অরিজিনগুলো নিজে অলাউ করে

2. **যদি আরও অরিজিন অলাউ করতে চান** (যেমন অন্য পোর্ট বা ডোমেইন):
   - `STOREFRONT_ORIGIN` এ কমা দিয়ে একাধিক অরিজিন দিন, যেমন:
     ```env
     STOREFRONT_ORIGIN=https://your-store.vercel.app,http://localhost:3000,http://localhost:3001
     ```
   - অথবা কোডে `src/proxy.ts` এর `getAllowedOrigins()` এ লিস্টে যোগ করুন।

3. **Credentials (কুকি)**  
   নির্দিষ্ট অরিজিন অলাউ করা থাকলে proxy অটোমেটিক `Access-Control-Allow-Credentials: true` সেট করে।

ডিপ্লয়ের পর localhost স্টোরফ্রন্ট থেকে আবার অর্ডার দিয়ে চেক করুন; CORS এরর না হওয়া উচিত।

---

## অন্য ব্যাকএন্ড (যেমন Express) থাকলে

যদি অ্যাডমিন API **Express** বা অন্য ফ্রেমওয়ার্কে চলে, নিচের মতো CORS সেট করুন।

### Express (Node.js)

```bash
npm install cors
```

```js
const cors = require("cors");

const allowedOrigins = [
  "https://your-store.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  "/api/ecommerce",
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
```

অথবা env থেকে:

```js
const allowedOrigins = (process.env.STOREFRONT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
allowedOrigins.push("http://localhost:3000", "http://localhost:3001");

app.use(
  "/api/ecommerce",
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
```

### Vercel Serverless / API Routes (অন্য প্রজেক্ট)

যদি Vercel এ API রাউট থাকে কিন্তু মিডলওয়্যার না থাকে, প্রতিটি রাউটের শুরুতেই হেডার সেট করতে পারেন:

```ts
const ALLOWED_ORIGINS = [
  process.env.STOREFRONT_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

export default function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  // ... আপনার লজিক
}
```

---

## স্টোরফ্রন্টে এরর মেসেজ (টোয়াস্ট)

localhost থেকে অর্ডার দেবার সময় যদি একই ধরনের **network/CORS এরর** হয়, স্টোরফ্রন্ট প্রজেক্টে টোয়াস্টে এই মেসেজ দেখানো ভালো:

> **Request blocked.** From localhost, the Admin Dashboard must allow CORS for your origin. In MOASS Admin Dashboard project set CORS to allow `http://localhost:3000` (and `3001` if you use it).

এটা ইউজারকে জানিয়ে দেবে যে সমস্যাটা CORS এবং অ্যাডমিন ড্যাশবোর্ডে অরিজিন অলাউ করতে হবে।

---

## সংক্ষেপে

| কোথায়        | কী করবেন |
|----------------|----------|
| **এই অ্যাডমিন ড্যাশবোর্ড (Next.js)** | মিডলওয়্যার ইতিমধ্যে localhost অলাউ করে; ভেরসেলে শুধু `STOREFRONT_ORIGIN` (প্রোড স্টোর) সেট করুন। |
| **Express**    | `cors` মিডলওয়্যার দিয়ে `http://localhost:3000` ও `3001` অলাউ করুন, `credentials: true` দিন। |
| **স্টোরফ্রন্ট** | CORS এরর হলে টোয়াস্টে উপরের মেসেজ দেখান। |
