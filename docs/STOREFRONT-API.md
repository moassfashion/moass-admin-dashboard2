# স্টোরফ্রন্ট API ডকুমেন্টেশন

আপনার স্টোরফ্রন্ট প্রজেক্ট (Next.js, React, Vue, মোবাইল অ্যাপ ইত্যাদি) থেকে **MOASS Admin Dashboard**-এর ডেটা ব্যবহার করে প্রোডাক্ট দেখাতে ও অর্ডার নিতে এই গাইড অনুসরণ করুন। সব পাবলিক API-তে **কোনো অথেন্টিকেশন লাগে না**।

**সিকিউরিটি লেয়ার ও অথেন্টিকেশন API:** [SECURITY.md](SECURITY.md) – অ্যাডমিন vs স্টোরফ্রন্ট প্রটেকশন, লগইন/রেজিস্টার/মি এন্ডপয়েন্ট, প্রটেক্টেড অ্যাডমিন API তালিকা।

**অ্যাডমিন ও স্টোরফ্রন্ট সুরক্ষিত সংযোগ:** [SECURE-CONNECTION.md](SECURE-CONNECTION.md) – CORS, env, চেকলিস্ট, কি কল করবেন/করবেন না।

---

## সূচিপত্র

1. [বেস URL ও সেটআপ](#১-বেস-url-ও-সেটআপ)
2. [প্রোডাক্ট API](#২-প্রোডাক্ট-api)
3. [ক্যাটাগরি API](#৩-ক্যাটাগরি-api)
4. [ব্যানার API](#৪-ব্যানার-api)
5. [শিপিং জোন API](#৫-শিপিং-জোন-api)
6. [কুপন ভ্যালিডেশন API](#৬-কুপন-ভ্যালিডেশন-api)
7. [অর্ডার প্লেস API](#৭-অর্ডার-প্লেস-api)
8. [পাবলিক সেটিংস API](#৮-পাবলিক-সেটিংস-api)
9. [ডেটা টাইপ রেফারেন্স](#৯-ডেটা-টাইপ-রেফারেন্স)
10. [চেকআউট ফ্লো (স্টেপ বাই স্টেপ)](#১০-চেকআউট-ফ্লো)
11. [CORS ও ডিপ্লয়মেন্ট](#১১-cors-ও-ডিপ্লয়মেন্ট)
12. [API সামারি টেবিল](#১২-api-সামারি-টেবিল)

---

## ১. বেস URL ও সেটআপ

### বেস URL

| পরিবেশ | URL |
|--------|-----|
| লোকাল | `http://localhost:3000` |
| প্রোডাকশন | `https://your-admin-domain.com` |

সব রিকোয়েস্টে **বেস URL + API পাথ** ব্যবহার করবেন।

### স্টোরফ্রন্ট প্রজেক্টে এনভায়রনমেন্ট ভেরিয়েবল

স্টোরফ্রন্ট প্রজেক্টে একটা env ভেরিয়েবল রাখুন যাতে এক জায়গা থেকে বেস URL বদলানো যায়:

```env
# .env.local (Next.js) অথবা .env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

প্রোডাকশনে:

```env
NEXT_PUBLIC_API_BASE_URL=https://admin.yourstore.com
```

### API ক্লায়েন্ট উদাহরণ (JavaScript/TypeScript)

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function apiGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiPost(path: string, body: object) {
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

---

## ২. প্রোডাক্ট API

### ২.১ প্রোডাক্ট লিস্ট (পেজিনেশন)

হোমপেজ বা ক্যাটাগরি পেজে প্রোডাক্ট লিস্ট দেখানোর জন্য। শুধুমাত্র **published** প্রোডাক্ট রিটার্ন হয়।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/products` |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | পেজ নম্বর |
| `limit` | number | No | 20 | প্রতি পেজে আইটেম (max 50) |
| `categoryId` | string | No | - | শুধু এই ক্যাটাগরির প্রোডাক্ট |
| `search` | string | No | - | নাম বা বিবরণে খুঁজুন |

#### Request উদাহরণ

```bash
curl "${API_BASE}/api/ecommerce/products?page=1&limit=12"
curl "${API_BASE}/api/ecommerce/products?categoryId=clxx...&limit=20"
curl "${API_BASE}/api/ecommerce/products?search=shirt"
```

```javascript
const data = await apiGet("/api/ecommerce/products", { page: "1", limit: "12" });
```

#### Success Response (200)

```json
{
  "products": [
    {
      "id": "clxx...",
      "name": "Product Name",
      "slug": "product-name",
      "description": "...",
      "price": "999.00",
      "compareAt": "1299.00",
      "images": "https://.../1.jpg,https://.../2.jpg",
      "stock": 10,
      "sku": "SKU-001",
      "categoryId": "clxx...",
      "category": { "id": "...", "name": "...", "slug": "..." },
      "published": true,
      "sortOrder": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 12
}
```

- `price`, `compareAt` ডেসিমাল হিসেবে string আসে (যেমন `"999.00"`)।
- `images` একটা string (কমা-সেপারেটেড URL)। ফ্রন্টএন্ডে `images.split(",")` করে অ্যারে বানাতে পারেন।

---

### ২.২ সিঙ্গেল প্রোডাক্ট (আইডি বা স্লাগ)

প্রোডাক্ট ডিটেইল পেজের জন্য। `[id]` এ প্রোডাক্টের **id** (cuid) অথবা **slug** দিলেই হয়।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/products/[id]` |

#### Request উদাহরণ

```bash
curl "${API_BASE}/api/ecommerce/products/clxx123..."
curl "${API_BASE}/api/ecommerce/products/blue-tshirt"
```

```javascript
const product = await apiGet(`/api/ecommerce/products/${idOrSlug}`);
```

#### Success Response (200)

একটা প্রোডাক্ট অবজেক্ট (লিস্টের আইটেমের মতোই, সাথে `category` সহ)। প্রোডাক্ট না থাকলে বা unpublished থাকলে **404**।

#### Error Response (404)

```json
{ "error": "Not found" }
```

---

## ৩. ক্যাটাগরি API

নেভিগেশন বা ফিল্টার এর জন্য সব ক্যাটাগরি।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/categories` |

#### Request উদাহরণ

```bash
curl "${API_BASE}/api/ecommerce/categories"
```

```javascript
const categories = await apiGet("/api/ecommerce/categories");
```

#### Success Response (200)

ক্যাটাগরির অ্যারে। প্রতিটিতে `parent`, `children`, `_count.products` থাকবে।

```json
[
  {
    "id": "clxx...",
    "name": "Electronics",
    "slug": "electronics",
    "description": null,
    "parentId": null,
    "parent": null,
    "children": [],
    "image": null,
    "sortOrder": 0,
    "_count": { "products": 5 },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## ৪. ব্যানার API

হোমপেজ স্লাইডার/ব্যানার এর জন্য। শুধুমাত্র **active** ব্যানার আসে।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/banners` |

#### Success Response (200)

```json
[
  {
    "id": "clxx...",
    "title": "Summer Sale",
    "image": "https://.../banner.jpg",
    "link": "/category/summer",
    "sortOrder": 0,
    "active": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## ৫. শিপিং জোন API

চেকআউটে শিপিং অপশন দেখানোর জন্য। অর্ডার সাবমিট করার সময় `shippingZoneId` দিতে হবে।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/shipping` |

#### Success Response (200)

```json
[
  {
    "id": "clxx...",
    "name": "Dhaka Metro",
    "regions": "Dhaka, Gazipur",
    "price": "80.00",
    "sortOrder": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

- অর্ডার বডিতে `shippingZoneId` হিসেবে এই `id` পাঠাবেন।

---

## ৬. কুপন ভ্যালিডেশন API

চেকআউটে কুপন কোড চেক করার জন্য। ভ্যালিড হলে কত ডিসকাউন্ট হবে সেটা জানতে পারবেন।

| বিষয় | মান |
|-------|-----|
| **Method** | `POST` |
| **Path** | `/api/ecommerce/coupons/validate` |
| **Content-Type** | `application/json` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | কুপন কোড (যেমন `SAVE10`) |
| `subtotal` | number | Yes | কার্টের সাবটোটাল (মিনিমাম অর্ডার চেক এর জন্য) |

#### Request উদাহরণ

```bash
curl -X POST "${API_BASE}/api/ecommerce/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{"code":"SAVE10","subtotal":1500}'
```

```javascript
const result = await apiPost("/api/ecommerce/coupons/validate", {
  code: "SAVE10",
  subtotal: 1500,
});
```

#### Success Response – ভ্যালিড (200)

```json
{
  "valid": true,
  "code": "SAVE10",
  "discount": 150,
  "type": "percent",
  "value": 10
}
```

- `type`: `"percent"` বা `"fixed"`
- `value`: পারসেন্ট হলে ১০ মানে ১০%, ফিক্সড হলে টাকার পরিমাণ।

#### Error Response – ইনভ্যালিড (400)

```json
{ "error": "Invalid or expired coupon" }
```

অন্যান্য এরর মেসেজ: `"Coupon not yet valid"`, `"Coupon expired"`, `"Coupon limit reached"`, `"Minimum order 500 required"` (উদাহরণ)।

---

## ৭. অর্ডার প্লেস API

চেকআউট থেকে অর্ডার সাবমিট করার জন্য। এই API কল করলে অর্ডার ডাটাবেইসে সেভ হয় এবং **অটোমেটিকভাবে অ্যাডমিন ড্যাশবোর্ডের অর্ডার লিস্টে দেখা যাবে**।

| বিষয় | মান |
|-------|-----|
| **Method** | `POST` |
| **Path** | `/api/ecommerce/orders` |
| **Content-Type** | `application/json` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer` | object | Yes | কাস্টমার তথ্য |
| `customer.email` | string | Yes | ইমেইল (বাধ্যতামূলক) |
| `customer.name` | string | No | নাম |
| `customer.phone` | string | No | ফোন |
| `customer.address` | string | No | ঠিকানা |
| `items` | array | Yes | অর্ডার আইটেম; কমপক্ষে ১টি |
| `items[].productId` | string | Yes | প্রোডাক্ট id (প্রোডাক্ট লিস্ট/ডিটেইল থেকে যে `id`) |
| `items[].quantity` | number | Yes | সংখ্যা (১ বা তার বেশি) |
| `couponCode` | string | No | কুপন কোড |
| `shippingZoneId` | string | No | শিপিং জোন id (`GET /api/ecommerce/shipping` থেকে) |
| `shippingAddress` | string | No | ডেলিভারি অ্যাড্রেস টেক্সট |
| `notes` | string | No | অতিরিক্ত নোট |

#### Request উদাহরণ

```bash
curl -X POST "${API_BASE}/api/ecommerce/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "email": "buyer@example.com",
      "name": "Buyer Name",
      "phone": "+8801712345678",
      "address": "House 1, Road 2, Dhaka"
    },
    "items": [
      { "productId": "clxx...", "quantity": 2 },
      { "productId": "clxy...", "quantity": 1 }
    ],
    "couponCode": "SAVE10",
    "shippingZoneId": "clxx...",
    "shippingAddress": "House 1, Road 2, Dhaka",
    "notes": "Please call before delivery"
  }'
```

```javascript
const order = await apiPost("/api/ecommerce/orders", {
  customer: {
    email: "buyer@example.com",
    name: "Buyer Name",
    phone: "+8801712345678",
    address: "House 1, Road 2, Dhaka",
  },
  items: [
    { productId: "clxx...", quantity: 2 },
    { productId: "clxy...", quantity: 1 },
  ],
  couponCode: "SAVE10",
  shippingZoneId: "clxx...",
  shippingAddress: "House 1, Road 2, Dhaka",
  notes: "Please call before delivery",
});
console.log("Order placed:", order.orderNumber);
```

#### Success Response (200)

তৈরি অর্ডার অবজেক্ট; সাথে `customer` ও `items` (প্রোডাক্ট সহ)।

```json
{
  "id": "clxx...",
  "orderNumber": "ORD-1709123456789-ABC12XY",
  "customerId": "clxx...",
  "customer": {
    "id": "clxx...",
    "email": "buyer@example.com",
    "name": "Buyer Name",
    "phone": "+8801712345678",
    "address": "House 1, Road 2, Dhaka"
  },
  "status": "pending",
  "subtotal": "1998.00",
  "shipping": "80.00",
  "tax": "0",
  "total": "1928.00",
  "couponCode": "SAVE10",
  "shippingZone": "Dhaka Metro",
  "shippingAddr": "House 1, Road 2, Dhaka",
  "notes": "Please call before delivery",
  "createdAt": "...",
  "updatedAt": "...",
  "items": [
    {
      "id": "clxx...",
      "orderId": "clxx...",
      "productId": "clxx...",
      "quantity": 2,
      "price": "999.00",
      "product": { "id": "...", "name": "...", "slug": "...", "price": "999.00", ... }
    }
  ]
}
```

- স্টোরফ্রন্টে কাস্টমারকে **অর্ডার নম্বর** (`orderNumber`) কনফার্মেশন পেজে দেখাতে পারবেন।

#### Error Responses (400)

| Situation | Response |
|-----------|----------|
| Validation (body ভুল) | `{ "error": "Validation failed", "details": {...} }` |
| কোনো আইটেম নেই | `{ "error": "At least one item required" }` |
| অচেনা/আনপাবলিশ প্রোডাক্ট | `{ "error": "Invalid or unpublished product", "productIds": ["..."] }` |
| স্টক কম | `{ "error": "Insufficient stock for Product Name", "productId": "..." }` |
| কুপন ইনভ্যালিড/এক্সপায়ার্ড | `{ "error": "Coupon expired" }` (অথবা অন্যান্য কুপন এরর) |
| মিনিমাম অর্ডার | `{ "error": "Minimum order 500 required" }` |

---

## ৮. পাবলিক সেটিংস API

সাইটের নাম, কারেন্সি ইত্যাদি সেটিংস (হেডার/ফুটার/কারেন্সি দেখানোর জন্য)।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/settings` |

#### Success Response (200)

```json
{
  "site_name": "MOASS Store",
  "currency": "BDT"
}
```

কীগুলো অ্যাডমিন সেটিংস অনুযায়ী ভিন্ন হতে পারে; যেগুলো পাবলিক সেগুলোই আসে।

---

## ৯. ডেটা টাইপ রেফারেন্স

### Product (প্রোডাক্ট লিস্ট/সিঙ্গেল)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | cuid |
| `name` | string | |
| `slug` | string | URL-friendly, ইউনিক |
| `description` | string \| null | |
| `price` | string | ডেসিমাল string (যেমন `"999.00"`) |
| `compareAt` | string \| null | আগের দাম (স্ট্রাইকথ্রু দেখানোর জন্য) |
| `images` | string | কমা-সেপারেটেড image URL |
| `stock` | number | |
| `sku` | string \| null | |
| `categoryId` | string \| null | |
| `category` | Category \| null | (লিস্ট/সিঙ্গেলে include করা থাকে) |
| `published` | boolean | স্টোরফ্রন্ট API শুধু published দেখায় |
| `sortOrder` | number | |
| `createdAt`, `updatedAt` | string (ISO) | |

### Category

| Field | Type |
|-------|------|
| `id`, `name`, `slug` | string |
| `description`, `image` | string \| null |
| `parentId` | string \| null |
| `parent`, `children` | Category \| null, Category[] |
| `_count.products` | number (ক্যাটাগরি API তে) |
| `sortOrder` | number |

### Order (অর্ডার প্লেস রেসপন্স)

| Field | Type |
|-------|------|
| `id`, `orderNumber` | string |
| `customerId` | string \| null |
| `customer` | Customer \| null |
| `status` | string (যেমন `"pending"`) |
| `subtotal`, `shipping`, `tax`, `total` | string (ডেসিমাল) |
| `couponCode`, `shippingZone`, `shippingAddr`, `notes` | string \| null |
| `items` | OrderItem[] (প্রোডাক্ট সহ) |
| `createdAt`, `updatedAt` | string (ISO) |

### OrderItem

| Field | Type |
|-------|------|
| `id`, `orderId`, `productId` | string |
| `quantity` | number |
| `price` | string (ডেসিমাল) |
| `product` | Product (অর্ডার রেসপন্সে include) |

---

## ১০. চেকআউট ফ্লো

স্টোরফ্রন্টে অর্ডার নেওয়ার জন্য নিচের স্টেপগুলো অনুসরণ করুন।

1. **প্রোডাক্ট ও শিপিং ডেটা লোড**
   - প্রোডাক্ট: `GET /api/ecommerce/products` বা `GET /api/ecommerce/products/[id]`
   - শিপিং অপশন: `GET /api/ecommerce/shipping`
   - (ঐচ্ছিক) সেটিংস: `GET /api/ecommerce/settings` (সাইট নাম, কারেন্সি)

2. **কার্ট বিল্ড করা**
   - ইউজার যে প্রোডাক্ট নিচ্ছে সেগুলোর `id` ও `quantity` রাখুন। অর্ডার সাবমিট করার সময় এই `productId` ও `quantity` দিতে হবে।

3. **কুপন চেক (ঐচ্ছিক)**
   - ইউজার কুপন দিলে: `POST /api/ecommerce/coupons/validate` with `{ code, subtotal }`।
   - ভ্যালিড হলে `discount` নিয়ে টোটাল থেকে বাদ দিন; ইনভ্যালিড হলে এরর মেসেজ দেখান।

4. **অর্ডার সাবমিট**
   - চেকআউট ফর্ম থেকে: `POST /api/ecommerce/orders` with `customer`, `items`, (ঐচ্ছিক) `couponCode`, `shippingZoneId`, `shippingAddress`, `notes`।
   - সফল হলে রেসপন্সে `orderNumber` পাবেন; কনফার্মেশন পেজে এই নম্বর দেখান।
   - অর্ডার অটোমেটিকভাবে অ্যাডমিন ড্যাশবোর্ডের অর্ডার লিস্টে চলে যাবে; আলাদা কিছু করার দরকার নেই।

5. **এরর হ্যান্ডলিং**
   - 400 এরর বডিতে `error` মেসেজ থাকে। স্টক কম, কুপন এক্সপায়ার্ড, মিনিমাম অর্ডার ইত্যাদি মেসেজ ইউজারকে দেখান।

---

## ১১. CORS ও ডিপ্লয়মেন্ট

### কখন CORS লাগে?

- স্টোরফ্রন্ট **আলাদা ডোমেইন** থেকে চালালে (যেমন স্টোর `https://shop.example.com`, API `https://admin.example.com`) ব্রাউজার ক্রস-অরিজিন রিকোয়েস্ট ব্লক করতে পারে। সেক্ষেত্রে অ্যাডমিন অ্যাপে CORS হেডার সেট করতে হবে।

### এই প্রজেক্টে CORS সেট করা (Next.js)

অ্যাডমিন ড্যাশবোর্ড প্রজেক্টে `next.config.ts` এ হেডার যোগ করুন:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/ecommerce/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }, // প্রোডে নির্দিষ্ট ডোমেইন দিন, যেমন "https://shop.example.com"
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

প্রোডাকশনে `Access-Control-Allow-Origin` এ শুধু আপনার স্টোরফ্রন্ট ডোমেইন দিন (যেমন `https://shop.example.com`)।

### একই ডোমেইনে স্টোরফ্রন্ট ও অ্যাডমিন

যদি স্টোরফ্রন্ট ও অ্যাডমিন একই ডোমেইনে থাকে (যেমন সাবপাথ: `/store` স্টোর, `/` অ্যাডমিন), তাহলে রিলেটিভ পাথ দিলেই হবে (`/api/ecommerce/products`); সেই ক্ষেত্রে CORS লাগে না।

---

## ১২. API সামারি টেবিল

| কাজ | Method | Path |
|-----|--------|------|
| প্রোডাক্ট লিস্ট | GET | `/api/ecommerce/products` |
| সিঙ্গেল প্রোডাক্ট | GET | `/api/ecommerce/products/[id]` |
| ক্যাটাগরি লিস্ট | GET | `/api/ecommerce/categories` |
| ব্যানার | GET | `/api/ecommerce/banners` |
| শিপিং জোন | GET | `/api/ecommerce/shipping` |
| কুপন ভ্যালিডেট | POST | `/api/ecommerce/coupons/validate` |
| অর্ডার প্লেস | POST | `/api/ecommerce/orders` |
| পাবলিক সেটিংস | GET | `/api/ecommerce/settings` |

---

এই ডকুমেন্ট দিয়ে স্টোরফ্রন্ট প্রজেক্ট থেকে অ্যাডমিন ড্যাশবোর্ডের API বালোভাবে কানেক্ট করতে পারবেন। কোনো এন্ডপয়েন্টে পরিবর্তন থাকলে এই ফাইল আপডেট করে নিন।
