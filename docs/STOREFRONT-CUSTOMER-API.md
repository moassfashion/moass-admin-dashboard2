# স্টোরফ্রন্ট: কাস্টমার API স্পেক

এই ডক **স্টোরফ্রন্ট প্রজেক্ট** থেকে শুধু **কাস্টমার** সম্পর্কিত API কীভাবে কল করবেন তার স্পেক। লগইন/রেজিস্টার, প্রোফাইল ও ঠিকানা সেভ, অর্ডার, রিওয়ার্ড — সব এক জায়গায়।

---

## বেস URL ও সেটআপ

| পরিবেশ | Base URL |
|--------|----------|
| লোকাল | `http://localhost:3000` (অথবা অ্যাডমিন যে পোর্টে চালাচ্ছেন) |
| প্রোডাকশন | `https://your-admin-domain.com` |

স্টোরফ্রন্টে একটা env রাখুন:

```env
NEXT_PUBLIC_API_BASE_URL=https://admin.yourstore.com
```

**কুকি (credentials) পাঠাতে হবে:** কাস্টমার লগইন করলে সেশন কুকি সেট হয়। তাই **প্রতিটি কাস্টমার API কলে** `credentials: "include"` দিতে হবে, নাহলে কুকি যাবে না।

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // জরুরি – কুকি পাঠানোর জন্য
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
```

**নোট:** অ্যাডমিন সাইটে CORS এ `STOREFRONT_ORIGIN` সেট থাকতে হবে (স্টোরফ্রন্টের ডোমেইন), নাহলে credentials সহ রিকোয়েস্ট ব্লক হবে।

---

## ১. কাস্টমার রেজিস্টার

| Method | Path |
|--------|------|
| POST | `/api/ecommerce/auth/register` |

**Body:**
```json
{
  "email": "customer@example.com",
  "password": "minimum-6-chars",
  "name": "Customer Name"
}
```

**সফল (200):**
```json
{
  "customer": {
    "id": "clxx...",
    "email": "customer@example.com",
    "name": "Customer Name",
    "phone": null,
    "address": null,
    "points": 0
  }
}
```
সেশন কুকি সেট হয়ে যায়; পরবর্তী সব কলে কুকি পাঠান।

**ব্যর্থ (400):** `{ "error": "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।" }`

---

## ২. কাস্টমার লগইন

| Method | Path |
|--------|------|
| POST | `/api/ecommerce/auth/login` |

**Body:**
```json
{
  "email": "customer@example.com",
  "password": "password"
}
```

**সফল (200):** উপরের মতো `{ "customer": { ... } }` + সেশন কুকি সেট।  
**ব্যর্থ (401):** `{ "error": "ইমেইল বা পাসওয়ার্ড ভুল।" }`

---

## ৩. কাস্টমার লগআউট

| Method | Path |
|--------|------|
| POST | `/api/ecommerce/auth/logout` |

**Body:** নেই।

**সফল (200):** `{ "ok": true }` — সেশন কুকি ডিলিট হয়।

---

## ৪. বর্তমান কাস্টমার (মি) – লগইন চেক + প্রোফাইল

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/auth/me` |

লগইন আছে কিনা চেক + নাম, ফোন, **ঠিকানা** (সেভ থাকলে) পাবেন। চেকআউটে এই ঠিকানা দিয়ে ফর্ম প্রি-ফিল করুন।

**সফল (200):**
```json
{
  "customer": {
    "id": "clxx...",
    "email": "customer@example.com",
    "name": "Name",
    "phone": "01xxxxxxxxx",
    "address": "House, Road, City",
    "points": 50
  }
}
```

**ব্যর্থ (401):** `{ "error": "লগইন করা নেই।" }`

---

## ৫. প্রোফাইল – ঠিকানা সেভ/আপডেট

কাস্টমার একবার ঠিকানা দিলে সেভ হয়; পরবর্তী অর্ডার পেজে লগইন থাকলে এই ঠিকানা দেখাবে।

### GET – প্রোফাইল দেখুন

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/profile` |

**সফল (200):** `{ "customer": { "id", "email", "name", "phone", "address", "points" } }`  
**ব্যর্থ (401):** লগইন নেই।

### PATCH – নাম/ফোন/ঠিকানা আপডেট (সেভ)

| Method | Path |
|--------|------|
| PATCH | `/api/ecommerce/customer/profile` |

**Body (যেগুলো আপডেট করবেন শুধু সেগুলো):**
```json
{
  "name": "New Name",
  "phone": "01xxxxxxxxx",
  "address": "House, Road, Area, City"
}
```

**সফল (200):** আপডেটেড `{ "customer": { ... } }`।

---

## ৬. অর্ডার প্লেস – লগইন থাকলে ঠিকানা অটো

`POST /api/ecommerce/orders` (মেইন স্টোরফ্রন্ট API ডকে বিস্তারিত আছে)।

- **লগইন কাস্টমার:** বডিতে `customer` পাঠানোর দরকার নেই। সেভ করা নাম/ফোন/ঠিকানা অটো ব্যবহার হবে। চেকআউটে আগে `GET /api/ecommerce/auth/me` দিয়ে ঠিকানা নিয়ে ফর্ম প্রি-ফিল করুন।
- **গেস্ট:** বডিতে `customer: { email, name?, phone?, address? }` দিন।

লগইন থাকলে অর্ডার সফল হলে **পয়েন্ট** যোগ হয় (প্রতি ১০০ টাকায় ১ পয়েন্ট)।

---

## ৭. আমার অর্ডার (ড্যাশবোর্ড)

### অর্ডার লিস্ট

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/orders` |

**Query:** `page` (ডিফল্ট 1), `limit` (ডিফল্ট 20)।

**সফল (200):**
```json
{
  "orders": [
    {
      "id": "clxx...",
      "orderNumber": "ORD-...",
      "status": "pending",
      "subtotal": "500.00",
      "shipping": "80.00",
      "total": "580.00",
      "items": [{ "quantity": 2, "price": "250.00", "product": { ... } }],
      "createdAt": "2025-03-02T..."
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### একটি অর্ডার ডিটেইল

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/orders/[id]` |

**সফল (200):** একটি অর্ডার অবজেক্ট (items + product সহ)।  
**ব্যর্থ (404):** অর্ডার নেই অথবা অন্য কাস্টমারের।

---

## ৮. রিওয়ার্ড (পয়েন্ট ও হিস্ট্রি)

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/rewards` |

**সফল (200):**
```json
{
  "points": 150,
  "rewards": [
    {
      "id": "clxx...",
      "points": 10,
      "reason": "অর্ডার #ORD-...",
      "orderId": "clxx...",
      "createdAt": "2025-03-02T..."
    }
  ]
}
```

---

## সংক্ষিপ্ত এন্ডপয়েন্ট তালিকা (কাস্টমার)

| কাজ | Method | Path |
|-----|--------|------|
| রেজিস্টার | POST | `/api/ecommerce/auth/register` |
| লগইন | POST | `/api/ecommerce/auth/login` |
| লগআউট | POST | `/api/ecommerce/auth/logout` |
| বর্তমান কাস্টমার (মি) | GET | `/api/ecommerce/auth/me` |
| প্রোফাইল দেখুন | GET | `/api/ecommerce/customer/profile` |
| প্রোফাইল আপডেট (ঠিকানা সেভ) | PATCH | `/api/ecommerce/customer/profile` |
| আমার অর্ডার লিস্ট | GET | `/api/ecommerce/customer/orders` |
| অর্ডার ডিটেইল | GET | `/api/ecommerce/customer/orders/[id]` |
| পয়েন্ট ও রিওয়ার্ড | GET | `/api/ecommerce/customer/rewards` |

সব কাস্টমার API কল **credentials: "include"** দিয়ে করুন।
