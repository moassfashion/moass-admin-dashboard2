# স্টোরফ্রন্ট কাস্টমার লগইন, ড্যাশবোর্ড ও রিওয়ার্ড API

কাস্টমার একবার লগইন/রেজিস্টার করলে ঠিকানা সেভ হয়; অর্ডার দেওয়ার সময় লগইন থাকলে সেভ করা ঠিকানা দেখাবে। ড্যাশবোর্ডে অর্ডার ও রিওয়ার্ড দেখানো যায়।

**অথেন্টিকেশন:** এই API গুলো কাস্টমার সেশন কুকি (`ecom_customer_session`) ব্যবহার করে। লগইন/রেজিস্টার সফল হলে এই কুকি সেট হয়। স্টোরফ্রন্ট থেকে কল করার সময় **credentials: "include"** দিয়ে fetch করুন যাতে কুকি যায়:  
`fetch(API_BASE + "/api/ecommerce/auth/me", { credentials: "include" })`

---

## ১. কাস্টমার রেজিস্টার

| Method | Path |
|--------|------|
| POST | `/api/ecommerce/auth/register` |

**Body (JSON):**
```json
{
  "email": "customer@example.com",
  "password": "minimum-6-chars",
  "name": "Customer Name"
}
```

**সফল (200):** `{ "customer": { "id", "email", "name", "phone", "address", "points" } }`  
**ব্যর্থ (400):** ইমেইল ইতিমধ্যে রেজিস্টার থাকলে: `{ "error": "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।" }`

---

## ২. কাস্টমার লগইন

| Method | Path |
|--------|------|
| POST | `/api/ecommerce/auth/login` |

**Body (JSON):**
```json
{
  "email": "customer@example.com",
  "password": "password"
}
```

**সফল (200):** `{ "customer": { "id", "email", "name", "phone", "address", "points" } }` + সেশন কুকি সেট  
**ব্যর্থ (401):** `{ "error": "ইমেইল বা পাসওয়ার্ড ভুল।" }`

---

## ৩. কাস্টমার লগআউট

| Method | Path |
|--------|------|
| POST | `/api/ecommerce/auth/logout` |

**সফল (200):** `{ "ok": true }` — সেশন কুকি ডিলিট হয়।

---

## ৪. বর্তমান কাস্টমার (মি)

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/auth/me` |

লগইন করা থাকলে কাস্টমার তথ্য রিটার্ন (নাম, ফোন, **ঠিকানা** — সেভ থাকলে এখানে পাবেন, চেকআউটে প্রি-ফিল করতে পারবেন)।

**সফল (200):** `{ "customer": { "id", "email", "name", "phone", "address", "points" } }`  
**ব্যর্থ (401):** `{ "error": "লগইন করা নেই।" }`

---

## ৫. প্রোফাইল (ঠিকানা সেভ/আপডেট)

কাস্টমার একবার ঠিকানা দিলে সেভ হয়; পরবর্তীতে অর্ডার পেজে লগইন থাকলে এই ঠিকানা দেখাবে।

### GET – প্রোফাইল দেখুন

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/profile` |

**সফল (200):** `{ "customer": { "id", "email", "name", "phone", "address", "points" } }`

### PATCH – নাম/ফোন/ঠিকানা আপডেট (সেভ)

| Method | Path |
|--------|------|
| PATCH | `/api/ecommerce/customer/profile` |

**Body (JSON):** যেগুলো আপডেট করবেন শুধু সেগুলো পাঠান।
```json
{
  "name": "New Name",
  "phone": "01xxxxxxxxx",
  "address": "House, Road, Area, City"
}
```

**সফল (200):** আপডেটেড `customer` অবজেক্ট।

---

## ৬. অর্ডার প্লেস (লগইন থাকলে ঠিকানা অটো)

`POST /api/ecommerce/orders` এ এখন দুভাবে ব্যবহার করা যায়:

1. **লগইন করা কাস্টমার:** বডিতে `customer` পাঠানোর দরকার নেই (ঐচ্ছিক ওভাররাইড)। সেভ করা নাম/ফোন/ঠিকানা ব্যবহার হবে। চেকআউটে `GET /api/ecommerce/auth/me` বা `GET /api/ecommerce/customer/profile` কল করে ফর্ম প্রি-ফিল করুন।
2. **গেস্ট:** আগের মতো বডিতে `customer: { email, name?, phone?, address? }` দিন।

লগইন থাকলে অর্ডার সফল হলে অটো **পয়েন্ট** যোগ হয় (প্রতি ১০০ টাকায় ১ পয়েন্ট) এবং রিওয়ার্ড হিস্ট্রিতে সেভ হয়।

---

## ৭. আমার অর্ডার (ড্যাশবোর্ড)

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/orders` |

**Query:** `page`, `limit` (ডিফল্ট limit=20)।

**সফল (200):**
```json
{
  "orders": [ { "id", "orderNumber", "status", "total", "items": [...], ... } ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### একটি অর্ডার ডিটেইল

| Method | Path |
|--------|------|
| GET | `/api/ecommerce/customer/orders/[id]` |

শুধু নিজের অর্ডার দেখতে পারবেন।

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
    { "id", "points", "reason", "orderId", "createdAt" }
  ]
}
```

অর্ডার দেওয়ার পর প্রতি ১০০ টাকায় ১ পয়েন্ট যোগ হয়; রিওয়ার্ড হিস্ট্রি এখানে থাকে।

---

## ৯. ডাটাবেজ মাইগ্রেশন (SQL রান)

কাস্টমার লগইন ও রিওয়ার্ড চালু করতে **একবার** নিচের SQL রান করতে হবে।

**Option A – Prisma Migrate (লোকাল ডেভ):**
```bash
npx prisma migrate dev --name customer_login_rewards
```

**Option B – হোস্টিংয়ে ম্যানুয়াল (phpMyAdmin / mysql ক্লায়েন্ট):**  
স্ক্রিপ্ট ফাইল চালান: **`scripts/customer-login-rewards.sql`**

ওই স্ক্রিপ্টে যা করা হয়:
- `Customer` টেবিলে `password` ও `points` কলাম যোগ
- `Customer.email` এ ইউনিক ইন্ডেক্স (লগইন লুকআপের জন্য)
- `CustomerReward` টেবিল তৈরি

**সতর্কতা:** যদি ইতিমধ্যে একই ইমেইল দিয়ে একাধিক `Customer` রেকর্ড থাকে, তাহলে আগে ডুপ্লিকেট ঠিক করুন (এক ইমেইলে এক রেকর্ড রাখুন), তারপর ইউনিক ইন্ডেক্স যোগ করুন। নাহলে “Duplicate entry” এরর আসবে।

SQL রান শেষে:
```bash
npx prisma generate
```

---

## ১০. সংক্ষিপ্ত এন্ডপয়েন্ট তালিকা

| কাজ | Method | Path |
|-----|--------|------|
| কাস্টমার রেজিস্টার | POST | `/api/ecommerce/auth/register` |
| কাস্টমার লগইন | POST | `/api/ecommerce/auth/login` |
| কাস্টমার লগআউট | POST | `/api/ecommerce/auth/logout` |
| বর্তমান কাস্টমার (মি) | GET | `/api/ecommerce/auth/me` |
| প্রোফাইল দেখুন/আপডেট | GET / PATCH | `/api/ecommerce/customer/profile` |
| আমার অর্ডার লিস্ট | GET | `/api/ecommerce/customer/orders` |
| একটি অর্ডার ডিটেইল | GET | `/api/ecommerce/customer/orders/[id]` |
| পয়েন্ট ও রিওয়ার্ড | GET | `/api/ecommerce/customer/rewards` |
