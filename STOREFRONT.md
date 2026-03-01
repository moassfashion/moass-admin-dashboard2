# স্টোরফ্রন্ট থেকে প্রোডাক্ট ও অর্ডার – গাইড

আপনার **আলাদা স্টোরফ্রন্ট প্রজেক্ট** (যেকোনো ফ্রন্টএন্ড: Next.js, React, Vue, মোবাইল অ্যাপ ইত্যাদি) থেকে এই অ্যাডমিন ড্যাশবোর্ডের ডেটা ব্যবহার করে প্রোডাক্ট দেখাতে ও অর্ডার নিতে এই API গুলো ব্যবহার করুন। **কোনো লগইন লাগে না** – শুধু ড্যাশবোর্ডের বেস URL দিয়ে কল করলেই হবে।

**→ সব properly কানেক্ট করতে এখান থেকে শুরু করুন:** [docs/README.md](docs/README.md) – এক জায়গায় স্টেপ বাই স্টেপ কানেক্ট গাইড, API তালিকা, কোড উদাহরণ ও চেকলিস্ট।

**সম্পূর্ণ API রেফারেন্স:** [docs/STOREFRONT-API.md](docs/STOREFRONT-API.md) – সব এন্ডপয়েন্ট, রিকোয়েস্ট/রেসপন্স উদাহরণ, ডেটা টাইপ, চেকআউট ফ্লো ও CORS।

---

## বেস URL

- লোকাল: `http://localhost:3000`
- প্রোড: `https://your-admin-domain.com`

সব রিকোয়েস্ট এই বেস URL এর সাথে নিচের পাথ গুলো যোগ করে করবেন।

---

## ১. প্রোডাক্ট লিস্ট (পেজিনেশন)

**GET** `/api/ecommerce/products`

| Query   | বর্ণনা        |
|--------|----------------|
| `page` | পেজ নম্বর (ডিফল্ট: 1) |
| `limit`| প্রতি পেজে কয়টি (ডিফল্ট: 20, ম্যাক্স: 50) |
| `categoryId` | শুধু এই ক্যাটাগরির প্রোডাক্ট |
| `search` | নাম/বিবরণে খুঁজুন |

**উদাহরণ**
```text
GET /api/ecommerce/products?page=1&limit=12
GET /api/ecommerce/products?categoryId=clxx...
GET /api/ecommerce/products?search=shirt
```

**রেসপন্স**
```json
{
  "products": [...],
  "total": 50,
  "page": 1,
  "limit": 12
}
```

প্রোডাক্ট অবজেক্টে থাকে: `id`, `name`, `slug`, `description`, `price`, `compareAt`, `images`, `stock`, `sku`, `category`, `categoryId` ইত্যাদি। শুধু **published** প্রোডাক্ট আসে।

---

## ২. সিঙ্গেল প্রোডাক্ট (আইডি বা স্লাগ)

**GET** `/api/ecommerce/products/[id]`

`[id]` এ প্রোডাক্টের **id** (cuid) অথবা **slug** দিলেই হয়।

**উদাহরণ**
```text
GET /api/ecommerce/products/clxx123...
GET /api/ecommerce/products/blue-tshirt
```

৪০৪ পাবেন যদি প্রোডাক্ট না থাকে বা unpublished হয়।

---

## ৩. ক্যাটাগরি লিস্ট

**GET** `/api/ecommerce/categories`

নেভ/ফিল্টার এর জন্য সব ক্যাটাগরি। প্রতিটিতে `parent`, `children`, `_count.products` থাকে।

---

## ৪. ব্যানার (হোমপেজ স্লাইডার)

**GET** `/api/ecommerce/banners`

শুধু **active** ব্যানার। `title`, `image`, `link`, `sortOrder`।

---

## ৫. শিপিং জোন (চেকআউট)

**GET** `/api/ecommerce/shipping`

চেকআউটে শিপিং অপশন দেখানোর জন্য। `id`, `name`, `regions`, `price`, `sortOrder`।

---

## ৬. কুপন ভ্যালিডেশন

**POST** `/api/ecommerce/coupons/validate`

**Body**
```json
{
  "code": "SAVE10",
  "subtotal": 1500
}
```

**রেসপন্স (ভ্যালিড)**
```json
{
  "valid": true,
  "code": "SAVE10",
  "discount": 150,
  "type": "percent",
  "value": 10
}
```

ভ্যালিড না হলে ৪০০ ও `error` মেসেজ।

---

## ৭. অর্ডার প্লেস (সবচেয়ে গুরুত্বপূর্ণ)

**POST** `/api/ecommerce/orders`

**Body**
```json
{
  "customer": {
    "email": "buyer@example.com",
    "name": "Buyer Name",
    "phone": "+880...",
    "address": "Full delivery address"
  },
  "items": [
    { "productId": "clxx...", "quantity": 2 },
    { "productId": "clxy...", "quantity": 1 }
  ],
  "couponCode": "SAVE10",
  "shippingZoneId": "clxx...",
  "shippingAddress": "Delivery address text",
  "notes": "Optional note"
}
```

- `customer.email` বাধ্যতামূলক। বাকি ঐচ্ছিক।
- `items` এ কমপক্ষে একটা আইটেম থাকতে হবে। `productId` অ্যাডমিনে যে প্রোডাক্ট আইডি সেটাই, `quantity` ১ বা তার বেশি।
- `couponCode`, `shippingZoneId`, `shippingAddress`, `notes` ঐচ্ছিক।

সার্ভার নিজে থেকে:
- প্রোডাক্ট প্রাইস ও স্টক চেক করে
- কুপন ভ্যালিড করে ও ডিসকাউন্ট বের করে
- শিপিং জোন থেকে শিপিং প্রাইস নেয়
- সাবটোটাল, শিপিং, ট্যাক্স, টোটাল ক্যালকুলেট করে
- কাস্টমার খুঁজে বা নতুন তৈরি করে
- অর্ডার ও অর্ডার আইটেম তৈরি করে, স্টক কমানো হয়, কুপন ব্যবহার কাউন্ট বাড়ে

**রেসপন্স:** তৈরি অর্ডার অবজেক্ট (অর্ডার নম্বর সহ), `customer` ও `items` (প্রোডাক্ট সহ)।

এরর হলে ৪০০ জসন (যেমন: `"Insufficient stock for ..."`, `"Coupon expired"`)।

---

## ৮. পাবলিক সেটিংস

**GET** `/api/ecommerce/settings`

সাইট নাম, কারেন্সি ইত্যাদি। উদাহরণ রেসপন্স:
```json
{
  "site_name": "MOASS Store",
  "currency": "BDT"
}
```

---

## স্টোরফ্রন্ট প্রজেক্টে কী করবেন (সংক্ষেপে)

1. **প্রোডাক্ট শো:**  
   `GET /api/ecommerce/products` ও `GET /api/ecommerce/products/[id]` দিয়ে লিস্ট ও ডিটেইল পেজ বানান। ক্যাটাগরি ফিল্টার ও সার্চ দিতে পারবেন।

2. **অর্ডার নেওয়া:**  
   কার্ট থেকে চেকআউটে গিয়ে কাস্টমার ইনফো + `items` (productId, quantity) জমা দিন। কুপন ও শিপিং জোন দিলে সেটাও পাঠান।  
   `POST /api/ecommerce/orders` কল করুন। রেসপন্সে অর্ডার নম্বর পাবেন – সেটা কাস্টমারকে দেখিয়ে দিতে পারবেন।

3. **CORS:**  
   স্টোরফ্রন্ট যদি অন্য ডোমেইন থেকে চলে (যেমন `https://shop.example.com` আর API `https://admin.example.com`), তাহলে এই নেক্সট অ্যাপে CORS হেডার সেট করতে হবে যাতে ব্রাউজার সেই ডোমেইন থেকে API কল করতে দেয়। প্রয়োজনে `next.config.js` বা API রাউটে `Access-Control-Allow-Origin` সেট করুন।

4. **একই ডোমেইনে রাখলে:**  
   স্টোরফ্রন্ট ও অ্যাডমিন একই ডোমেইনে থাকলে (যেমন সাবপাথ: `/store` স্টোরফ্রন্ট, `/` অ্যাডমিন) রিলেটিভ পাথ দিয়ে কল করলেই হবে: `/api/ecommerce/products` ইত্যাদি।

---

## সংক্ষিপ্ত API লিস্ট

| কাজ              | মেথড | পাথ |
|------------------|------|-----|
| প্রোডাক্ট লিস্ট   | GET  | `/api/ecommerce/products` |
| সিঙ্গেল প্রোডাক্ট | GET  | `/api/ecommerce/products/[id]` |
| ক্যাটাগরি        | GET  | `/api/ecommerce/categories` |
| ব্যানার          | GET  | `/api/ecommerce/banners` |
| শিপিং জোন        | GET  | `/api/ecommerce/shipping` |
| কুপন চেক         | POST | `/api/ecommerce/coupons/validate` |
| অর্ডার প্লেস     | POST | `/api/ecommerce/orders` |
| পাবলিক সেটিংস    | GET  | `/api/ecommerce/settings` |

এই ড্যাশবোর্ড চালু ও ডাটাবেস সিড থাকলে উপরের API গুলো দিয়ে আলাদা স্টোরফ্রন্ট থেকে প্রোডাক্ট শো ও অর্ডার নেওয়া সম্পূর্ণভাবে সম্ভব।
