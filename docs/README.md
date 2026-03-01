# স্টোরফ্রন্ট কানেক্ট গাইড – এখান থেকে শুরু করুন

এই একটা ডকুমেন্ট দিয়ে **অ্যাডমিন ড্যাশবোর্ড** ও **স্টোরফ্রন্ট** সঠিক ও সুরক্ষিতভাবে কানেক্ট করতে পারবেন। নিচের স্টেপগুলো Order অনুযায়ী করুন।

---

## দ্রুত সংযোগ (৩ স্টেপ)

### স্টেপ ১: অ্যাডমিন ড্যাশবোর্ড প্রজেক্টে (এই রিপো)

1. অ্যাডমিন অ্যাপ চালু আছে কিনা দেখুন (`npm run dev` → সাধারণত `http://localhost:3000`)।
2. ডাটাবেস ও টেবিল সেট আপ থাকতে হবে (Prisma migrate/seed)। প্রোডে ডিপ্লয় করা থাকলে সেখানে `DATABASE_URL`, `AUTH_SECRET` সেট করুন।
3. **প্রোডাকশনে** স্টোরফ্রন্ট ডোমেইন CORS এ দিতে env এ যোগ করুন:
   ```env
   STOREFRONT_ORIGIN=https://shop.yourstore.com
   ```
   (লোকাল ডেভের জন্য এটা খালি রাখলেই হয়।)

### স্টেপ ২: স্টোরফ্রন্ট প্রজেক্টে

1. Env ফাইলে অ্যাডমিন অ্যাপের বেস URL দিন (কোনো জায়গায় URL হার্ডকড করবেন না):
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```
   প্রোডে:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://admin.yourstore.com
   ```

2. নিচের হেল্পার ফাংশন দিয়ে API কল করুন (অথবা নিজের ফেভারিট পদ্ধতি – শুধু বেস URL env থেকে নিন):

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export async function apiGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function apiPost(path: string, body: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}
```

### স্টেপ ৩: স্টোরফ্রন্টে কোন API কখন কল করবেন

| আপনি কী করছেন | API | উদাহরণ |
|----------------|-----|--------|
| হোম/প্রোডাক্ট লিস্ট | `GET /api/ecommerce/products` | `apiGet("/api/ecommerce/products", { page: "1", limit: "12" })` |
| প্রোডাক্ট ডিটেইল | `GET /api/ecommerce/products/[id]` বা `[slug]` | `apiGet("/api/ecommerce/products/blue-tshirt")` |
| ক্যাটাগরি মেনু/ফিল্টার | `GET /api/ecommerce/categories` | `apiGet("/api/ecommerce/categories")` |
| হোম ব্যানার | `GET /api/ecommerce/banners` | `apiGet("/api/ecommerce/banners")` |
| চেকআউটে শিপিং অপশন | `GET /api/ecommerce/shipping` | `apiGet("/api/ecommerce/shipping")` |
| সাইট নাম/কারেন্সি | `GET /api/ecommerce/settings` | `apiGet("/api/ecommerce/settings")` |
| কুপন চেক | `POST /api/ecommerce/coupons/validate` | `apiPost("/api/ecommerce/coupons/validate", { code: "SAVE10", subtotal: 1500 })` |
| অর্ডার সাবমিট | `POST /api/ecommerce/orders` | নিচের অর্ডার বডি দেখুন |

**অর্ডার বডি (কমপক্ষে):**
```json
{
  "customer": { "email": "buyer@example.com", "name": "...", "phone": "...", "address": "..." },
  "items": [ { "productId": "প্রোডাক্টের-id", "quantity": 2 } ]
}
```
ঐচ্ছিক: `couponCode`, `shippingZoneId`, `shippingAddress`, `notes`।

অর্ডার সফল হলে রেসপন্সে `orderNumber` পাবেন; সেটা কাস্টমারকে দেখান। অর্ডার অটোমেটিক অ্যাডমিন ড্যাশবোর্ডের অর্ডার লিস্টে চলে যাবে।

---

## সম্পূর্ণ API তালিকা (এক নজরে)

| কাজ | Method | Path |
|-----|--------|------|
| প্রোডাক্ট লিস্ট | GET | `/api/ecommerce/products` |
| সিঙ্গেল প্রোডাক্ট (id বা slug) | GET | `/api/ecommerce/products/[id]` |
| ক্যাটাগরি লিস্ট | GET | `/api/ecommerce/categories` |
| ব্যানার | GET | `/api/ecommerce/banners` |
| শিপিং জোন | GET | `/api/ecommerce/shipping` |
| পাবলিক সেটিংস | GET | `/api/ecommerce/settings` |
| কুপন ভ্যালিডেট | POST | `/api/ecommerce/coupons/validate` |
| অর্ডার প্লেস | POST | `/api/ecommerce/orders` |

**স্টোরফ্রন্ট থেকে শুধু এই ইকমার্স API গুলো ব্যবহার করবেন।** অ্যাডমিন API (`/api/admin/*`) বা লগইন স্টোরফ্রন্ট থেকে কল করবেন না।

---

## সুরক্ষিত সংযোগ (সংক্ষেপে)

- **অ্যাডমিন:** প্রোডে `AUTH_SECRET` ও `STOREFRONT_ORIGIN` (স্টোর সাইট URL) সেট করুন; HTTPS চালু রাখুন।
- **স্টোরফ্রন্ট:** API বেস URL env থেকে নিন; অ্যাডমিন পাসওয়ার্ড/লগইন কোথাও রাখবেন না; শুধু `/api/ecommerce/*` কল করুন।

বিস্তারিত: [SECURE-CONNECTION.md](SECURE-CONNECTION.md)

---

## আরও বিস্তারিত ডকুমেন্ট

| ডকুমেন্ট | কখন দেখবেন |
|----------|-------------|
| **[STOREFRONT-API.md](STOREFRONT-API.md)** | প্রতিটি API-র পূর্ণ বিবরণ, query/body, রেসপন্স উদাহরণ, ডেটা টাইপ, চেকআউট ফ্লো, CORS। |
| **[SECURE-CONNECTION.md](SECURE-CONNECTION.md)** | অ্যাডমিন ও স্টোরফ্রন্ট সুরক্ষিত সংযোগের চেকলিস্ট, CORS সেটআপ, কি করবেন/করবেন না। |
| **[SECURITY.md](SECURITY.md)** | অ্যাডমিন vs স্টোরফ্রন্ট প্রটেকশন, লগইন/মি/পাসওয়ার্ড API, প্রটেক্টেড অ্যাডমিন API তালিকা। |

---

## চেকলিস্ট – সব ঠিক আছে কিনা

- [ ] অ্যাডমিন অ্যাপ চালু ও ডাটাবেস কানেক্ট
- [ ] স্টোরফ্রন্টে `NEXT_PUBLIC_API_BASE_URL` সেট (লোকাল/প্রোড)
- [ ] স্টোরফ্রন্টে শুধু `/api/ecommerce/*` কল করা হচ্ছে
- [ ] প্রোডে অ্যাডমিনে `STOREFRONT_ORIGIN` ও `AUTH_SECRET` সেট
- [ ] প্রোডে অ্যাডমিন ও স্টোর দুটোই HTTPS

এই গাইড ও উপরের ডকুমেন্টগুলো মেনে চললে অ্যাডমিন ড্যাশবোর্ড ও স্টোরফ্রন্ট সব properly কানেক্ট থাকবে।
