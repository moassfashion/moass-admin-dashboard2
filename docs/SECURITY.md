# সিকিউরিটি লেয়ার ও API এন্ডপয়েন্ট

এই ডকুমেন্টে অ্যাডমিন ড্যাশবোর্ডের সিকিউরিটি মডেল ও অথেন্টিকেশন-সম্পর্কিত API গুলো বর্ণনা করা হয়েছে।

---

## ১. সারাংশ

| দিক | বর্তমান অবস্থা |
|-----|-----------------|
| **অ্যাডমিন API** | সেশন কুকি দিয়ে প্রটেক্টেড; লগইন ছাড়া অ্যাক্সেস করা যায় না |
| **স্টোরফ্রন্ট (ecommerce) API** | পাবলিক; কোনো অথেন্টিকেশন নেই (ডিজাইন অনুযায়ী) |
| **অথেন্টিকেশন** | JWT সেশন কুকি (`ecomdash_session`), HTTP-only, SameSite=Lax |
| **মিডলওয়্যার** | নেই (প্রতিটি অ্যাডমিন রাউট নিজে `requireUser()` চালায়) |
| **রেট লিমিটিং** | নেই (ecommerce বা auth এ) |
| **API কী (স্টোরফ্রন্ট)** | নেই |

---

## ২. কিভাবে প্রটেকশন কাজ করে

### অ্যাডমিন ড্যাশবোর্ড (পেজ)

- ড্যাশবোর্ডের প্রতিটি পেজে `getCurrentUser()` কল হয়; ইউজার না থাকলে **রিডাইরেক্ট** → `/auth/v2/login`।
- ড্যাশবোর্ড লেআউট সাইডবার দেখায়; লগইন চেক পেজ লেভেলে হয়।

### অ্যাডমিন API (`/api/admin/*` ও কিছু `/api/auth/*`)

- প্রতিটি রাউটে **`requireUser()`** ব্যবহার করা হয় (`src/lib/api-auth.ts`)।
- `requireUser()` ভিতরে `getCurrentUser()` চালায় → কুকি থেকে সেশন পড়ে → JWT ভেরিফাই করে → ইউজার ডিবি থেকে নিয়ে আসে।
- ইউজার না থাকলে **401 Unauthorized** + `{ "error": "Unauthorized" }` রিটার্ন হয়।
- ব্রাউজার একই অরিজিন থেকে ড্যাশবোর্ড ব্যবহার করলে কুকি অটোমেটিক যাবে; অন্য ডোমেইন/Postman থেকে অ্যাডমিন API কল করতে হলে সেশন কুকি দিতে হবে।

### স্টোরফ্রন্ট API (`/api/ecommerce/*`)

- **কোনো অথেন্টিকেশন নেই** – ডিজাইন অনুযায়ী পাবলিক।
- প্রোডাক্ট, ক্যাটাগরি, ব্যানার, শিপিং, কুপন ভ্যালিডেট, অর্ডার প্লেস – সব বিনা লগইনে কল করা যায়।
- রেট লিমিটিং বা API কী নেই; প্রোডাকশনে চাইলে আলাদা লেয়ার (reverse proxy, API gateway) দিয়ে রেট লিমিট বা API কী যোগ করা যায়।

---

## ৩. অথেন্টিকেশন রিলেটেড API এন্ডপয়েন্ট

এগুলো অ্যাডমিন/লগইন ফ্লোর জন্য।

| এন্ডপয়েন্ট | মেথড | অথেন্টিকেশন | বর্ণনা |
|-------------|--------|----------------|--------|
| `/api/auth/login` | POST | না (পাবলিক) | ইমেইল + পাসওয়ার্ড দিয়ে লগইন; সেশন কুকি সেট হয় |
| `/api/auth/register` | POST | না (পাবলিক) | রেজিস্ট্রেশন; সেশন কুকি সেট হয় |
| `/api/auth/logout` | POST | না | সেশন কুকি ডিলিট করে |
| `/api/auth/me` | GET | হ্যাঁ (`requireUser`) | বর্তমান লগড-ইন ইউজার রিটার্ন করে |
| `/api/auth/password` | POST | হ্যাঁ (`requireUser`) | পাসওয়ার্ড চেঞ্জ |
| `/api/upload` | POST | হ্যাঁ (`requireUser`) | ফাইল আপলোড (অ্যাডমিন) |

### লগইন রিকোয়েস্ট উদাহরণ

```bash
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "your-password" }
```

**সফল (200):** `{ "user": { "id": "...", "email": "...", "name": "...", "role": "admin" } }`  
**ব্যর্থ (401):** `{ "error": "Invalid email or password" }`

লগইন সফল হলে রেসপন্সের **Set-Cookie** হেডারে `ecomdash_session` (JWT) সেট হয়; পরবর্তী অ্যাডমিন API কলের সময় ব্রাউজার এই কুকি পাঠায়।

---

## ৪. প্রটেক্টেড (অ্যাডমিন) API এন্ডপয়েন্ট তালিকা

সবগুলোতে **`requireUser()`** আছে – সেশন কুকি ছাড়া 401।

- `GET/POST` `/api/admin/products`  
- `GET/PATCH/DELETE` `/api/admin/products/[id]`  
- `GET/POST` `/api/admin/categories`  
- `GET/PATCH/DELETE` `/api/admin/categories/[id]`  
- `GET/POST` `/api/admin/banners`  
- `GET/PATCH/DELETE` `/api/admin/banners/[id]`  
- `GET/POST` `/api/admin/coupons`  
- `GET/PATCH/DELETE` `/api/admin/coupons/[id]`  
- `GET` `/api/admin/orders`  
- `GET/PATCH` `/api/admin/orders/[id]`  
- `GET` `/api/admin/customers`  
- `GET/PATCH` `/api/admin/customers/[id]`  
- `GET` `/api/admin/inventory`  
- `PATCH` `/api/admin/inventory/[id]`  
- `GET/POST` `/api/admin/shipping`  
- `PATCH/DELETE` `/api/admin/shipping/[id]`  
- `GET` `/api/admin/dashboard`  
- `GET/PUT` `/api/admin/settings`  
- `GET` `/api/admin/reports/sales`  
- `GET` `/api/admin/reports/top-products`  
- `GET/PUT` `/api/admin/account`  
- `POST` `/api/upload`

---

## ৫. পাবলিক (স্টোরফ্রন্ট) API এন্ডপয়েন্ট

কোনো অথেন্টিকেশন নেই।

- `GET` `/api/ecommerce/products`  
- `GET` `/api/ecommerce/products/[id]`  
- `GET` `/api/ecommerce/categories`  
- `GET` `/api/ecommerce/banners`  
- `GET` `/api/ecommerce/shipping`  
- `POST` `/api/ecommerce/coupons/validate`  
- `POST` `/api/ecommerce/orders`  
- `GET` `/api/ecommerce/settings`  

বিস্তারিত: [STOREFRONT-API.md](STOREFRONT-API.md)

---

## ৬. সেশন ও সিক্রেট

- **কুকি নাম:** `ecomdash_session`  
- **কন্টেন্ট:** JWT (HS256), payload এ `sub` (user id), `email`।  
- **সেটিংস:** `httpOnly: true`, `secure: true` প্রোডে, `sameSite: "lax"`, ম্যাক্স এজ ৭ দিন।  
- **সিক্রেট:** `process.env.AUTH_SECRET`। প্রোডাকশনে সেট করা বাধ্যতামূলক (ডিফল্ট `"change-me"` থাকলে অ্যাপ এরর দেয়)।

---

## ৭. যা এখন নেই (পরবর্তীতে যোগ করা যেতে পারে)

- **রেট লিমিটিং:** লগইন বা ecommerce এন্ডপয়েন্টে রেট লিমিট নেই।  
- **স্টোরফ্রন্ট API কী:** স্টোরফ্রন্ট থেকে অর্ডার/প্রোডাক্ট API কল করতে আলাদা API কী লাগে না।  
- **গ্লোবাল মিডলওয়্যার:** Next.js `middleware.ts` দিয়ে অ্যাডমিন রাউট ব্লক করা হয় না; প্রতিটি রাউট নিজে `requireUser()` ব্যবহার করে।  
- **Role-based অ্যাক্সেস:** ইউজার টেবিলে `role` ফিল্ড আছে, কিন্তু API তে রোল চেক করা হয় না – যে কেউ লগইন করলে সব অ্যাডমিন API একসেস পায়।

এই ডকুমেন্ট দিয়ে বোঝা যাবে অ্যাপে সিকিউরিটি লেয়ার কোথায় আছে এবং অথেন্টিকেশন রিলেটেড API এন্ডপয়েন্টগুলো কী।

**অ্যাডমিন ও স্টোরফ্রন্ট সুরক্ষিত সংযোগ:** [SECURE-CONNECTION.md](SECURE-CONNECTION.md)
