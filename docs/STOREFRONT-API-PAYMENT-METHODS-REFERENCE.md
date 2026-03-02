# Storefront API: Payment Methods (Reference)

স্টোরফ্রন্ট চেকআউটে পেমেন্ট অপশন ও অর্ডার সাবমিটের জন্য শুধু API রেফারেন্স।

---

## ১. পেমেন্ট মেথড লিস্ট (পাবলিক)

চেকআউটে কোন পেমেন্ট অপশন দেখাবে তা নিতে এই API কল করুন। **অথেন্টিকেশন লাগে না**।

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `{BASE_URL}/api/ecommerce/payment-methods` |

### Response (200)

```json
{
  "payment_methods": [
    {
      "id": "clxx...",
      "name": "Cash on Delivery",
      "type": "COD",
      "instructions": null,
      "account_number": null,
      "logo_url": null
    },
    {
      "id": "clxy...",
      "name": "bKash",
      "type": "MANUAL",
      "instructions": "Send money to the number below and enter your Transaction ID.",
      "account_number": "01XXXXXXXXX",
      "logo_url": "https://..."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | অর্ডার সাবমিটের সময় `payment_method_id` হিসেবে পাঠাতে হবে |
| `name` | string | ইউজারকে দেখানোর নাম (যেমন "bKash", "Cash on Delivery") |
| `type` | `"COD"` \| `"MANUAL"` | COD = ক্যাশ অন ডেলিভারি; MANUAL = bKash/Nagad ইত্যাদি (ট্রানজেকশন আইডি লাগে) |
| `instructions` | string \| null | MANUAL এর জন্য নির্দেশনা টেক্সট (ইউজারকে দেখান) |
| `account_number` | string \| null | MANUAL এর জন্য নম্বর যেখানে টাকা পাঠাতে হবে |
| `logo_url` | string \| null | লোগো ইমেজ URL (ঐচ্ছিক) |

- শুধু **active** মেথড আসে; অর্ডার অনুযায়ী সর্টেড।

---

## ২. অর্ডার প্লেস – পেমেন্ট ফিল্ড

অর্ডার সাবমিট: `POST {BASE_URL}/api/ecommerce/orders`

বডিতে পেমেন্ট সম্পর্কিত ফিল্ড:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_method_id` | string | No | সিলেক্টেড মেথডের `id` (উপরের API থেকে) |
| `transaction_id` | string | **হ্যাঁ, যদি type = MANUAL** | bKash/Nagad ইত্যাদির ট্রানজেকশন আইডি |
| `sender_number` | string | No | যে নম্বর থেকে পেমেন্ট পাঠানো (ঐচ্ছিক) |

### নিয়ম

- **MANUAL** মেথড সিলেক্ট করলে `transaction_id` **অবশ্যই** পাঠাতে হবে। না দিলে API **422** দেবে।
- **COD** সিলেক্ট করলে `transaction_id` বা `sender_number` দিতে হয় না。

### Request উদাহরণ (MANUAL – bKash)

```json
{
  "customer": {
    "email": "buyer@example.com",
    "name": "Buyer Name",
    "phone": "01712345678",
    "address": "Dhaka"
  },
  "items": [
    { "productId": "clxx...", "quantity": 1 }
  ],
  "payment_method_id": "clxy...",
  "transaction_id": "TRX123456",
  "sender_number": "01712345678"
}
```

### Request উদাহরণ (COD)

```json
{
  "customer": {
    "email": "buyer@example.com",
    "name": "Buyer Name",
    "address": "Dhaka"
  },
  "items": [
    { "productId": "clxx...", "quantity": 1 }
  ],
  "payment_method_id": "clxz..."
}
```

### Error (422 – MANUAL এ transaction_id নেই)

```json
{
  "error": "Transaction ID is required for this payment method"
}
```

---

## ৩. চেকআউটে কি করবেন (সংক্ষেপে)

1. পেজ লোডে **GET** `/api/ecommerce/payment-methods` → `payment_methods` দিয়ে রেডিও/কার্ড দেখান।
2. **MANUAL** সিলেক্ট হলে: `account_number` + `instructions` দেখান, **Transaction ID** (required) ও **Sender Number** (optional) ইনপুট নিন।
3. **COD** সিলেক্ট হলে: ট্রানজেকশন ফিল্ড লুকিয়ে রাখুন।
4. সাবমিটে `POST /api/ecommerce/orders` এ `payment_method_id` এবং MANUAL হলে `transaction_id` (ও ঐচ্ছিক `sender_number`) পাঠান।

বিস্তারিত UI ফ্লো: [STOREFRONT-API-PAYMENT-METHODS.md](STOREFRONT-API-PAYMENT-METHODS.md)
