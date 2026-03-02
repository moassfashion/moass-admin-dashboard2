# পেমেন্ট মেথড ও চেকআউট UI

অ্যাডমিন ড্যাশবোর্ডে পেমেন্ট মেথড কনফিগার করা যায়; স্টোরফ্রন্ট চেকআউটে সেই মেথডগুলো ডায়নামিকভাবে দেখাতে এই API ও UI লজিক ব্যবহার করুন।

---

## ১. পেমেন্ট মেথড API (পাবলিক)

চেকআউট পেজে কোন পেমেন্ট অপশন দেখাবে তা এই API দিয়ে নিন। **কোন অথেন্টিকেশন লাগে না**।

| বিষয় | মান |
|-------|-----|
| **Method** | `GET` |
| **Path** | `/api/ecommerce/payment-methods` |

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

- শুধু **active** পেমেন্ট মেথড রিটার্ন হয়, `sort_order` অনুযায়ী সর্টেড।
- `type`: `"COD"` = ক্যাশ অন ডেলিভারি, `"MANUAL"` = bKash/Nagad ইত্যাদি (ট্রানজেকশন আইডি লাগে)।

---

## ২. অর্ডার প্লেসে পেমেন্ট ফিল্ড

`POST /api/ecommerce/orders` বডিতে নিচের ফিল্ডগুলো যোগ করুন:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_method_id` | string | No | সিলেক্টেড পেমেন্ট মেথডের `id` (`GET /api/ecommerce/payment-methods` থেকে) |
| `transaction_id` | string | If MANUAL | পেমেন্ট মেথডের টাইপ `MANUAL` হলে **বাধ্যতামূলক** (যেমন bKash TrxID) |
| `sender_number` | string | No | যে নম্বর থেকে পেমেন্ট পাঠানো (ঐচ্ছিক) |

### ভ্যালিডেশন

- যদি নির্বাচিত মেথডের `type === "MANUAL"` হয় এবং `transaction_id` খালি/না দেওয়া হয় → API **422** রিটার্ন করবে, এরর: `"Transaction ID is required for this payment method"`।
- `type === "COD"` হলে `transaction_id` লাগে না।

### উদাহরণ (bKash সিলেক্ট করলে)

```javascript
const order = await apiPost("/api/ecommerce/orders", {
  customer: { email: "buyer@example.com", name: "Buyer", phone: "017...", address: "..." },
  items: [{ productId: "clxx...", quantity: 1 }],
  payment_method_id: "clxy...",   // bKash method id
  transaction_id: "TRX123456",
  sender_number: "01712345678", // optional
});
```

### উদাহরণ (COD)

```javascript
const order = await apiPost("/api/ecommerce/orders", {
  customer: { email: "buyer@example.com", name: "Buyer", address: "..." },
  items: [{ productId: "clxx...", quantity: 1 }],
  payment_method_id: "clxz...",  // COD method id
  // transaction_id ও sender_number দিতে হবে না
});
```

---

## ৩. স্টোরফ্রন্ট চেকআউট UI লজিক

চেকআউট পেজে নিচের ফ্লো অনুসরণ করুন।

### স্টেপ ১: পেমেন্ট মেথড লোড

পেজ লোডে `GET /api/ecommerce/payment-methods` কল করুন এবং রেসপন্সের `payment_methods` অ্যারেটা স্টেটে রাখুন।

### স্টেপ ২: রেডিও বাটন রেন্ডার

প্রতিটি পেমেন্ট মেথডের জন্য একটা রেডিও অপশন দেখান (নাম এবং ঐচ্ছিক লোগো)। ইউজার একটি সিলেক্ট করলে সিলেক্টেড মেথডের অবজেক্ট (অন্তত `id`, `type`) স্টেটে রাখুন।

### স্টেপ ৩: টাইপ অনুযায়ী এক্সট্রা UI

**যদি সিলেক্টেড মেথডের `type === "MANUAL"` হয়:**

1. একটা ছোট **ইনফো বক্স/কার্ড** দেখান যাতে:
   - মেথডের `account_number` (বল্ড) — যেখানে টাকা পাঠাতে হবে
   - মেথডের `instructions` — নির্দেশনা টেক্সট
2. **Transaction ID** (টেক্সট ইনপুট) — **required**
3. **Sender Number** (টেক্সট ইনপুট) — optional

**যদি `type === "COD"` হয়:**

- ট্রানজেকশন আইডি ও সেন্ডার নম্বর ফিল্ড **লুকিয়ে রাখুন**; শুধু অর্ডার কনফার্ম বাটন সক্রিয় রাখুন।

### স্টেপ ৪: ফর্ম সাবমিট

1. সাবমিটের আগে চেক করুন: যদি সিলেক্টেড মেথড `MANUAL` এবং ট্রানজেকশন আইডি খালি → ক্লায়েন্ট সাইডে এরর দেখান, সাবমিট করবেন না।
2. সাবমিট করলে বডিতে পাঠান:
   - `payment_method_id`: সিলেক্টেড মেথডের `id`
   - `transaction_id`: MANUAL হলে ইউজার দেওয়া মান, COD হলে বাদ বা `null`
   - `sender_number`: ঐচ্ছিক, ইউজার দিলে পাঠান

### সংক্ষিপ্ত ফ্লো চার্ট

```
[পেজ লোড] → GET /api/ecommerce/payment-methods
     ↓
[ইউজার পেমেন্ট মেথড সিলেক্ট করে]
     ↓
type === "MANUAL" ? [ইনফো বক্স + Account Number + Instructions + TrxID (required) + Sender (optional)] : [কিছু এক্সট্রা ফিল্ড নেই]
     ↓
[Place Order ক্লিক]
     ↓
MANUAL এবং transaction_id খালি? → এরর দেখান
     ↓
POST /api/ecommerce/orders with payment_method_id, transaction_id (if MANUAL), sender_number (optional)
```

---

## ৪. অ্যাডমিনে পেমেন্ট মেথড সেটআপ

ড্যাশবোর্ডে **Payment Methods** পেজে (`/payment-methods`):

- সব পেমেন্ট মেথডের তালিকা, একটিভ/ইনঅ্যাকটিভ টগল, এডিট, ডিলিট।
- **Add Payment Method** দিয়ে নতুন মেথড যোগ করুন:
  - **Name**: যেমন "bKash", "Nagad", "Cash on Delivery"
  - **Type**: COD অথবা Manual
  - **Account Number** ও **Instructions**: শুধু Manual টাইপে দেখানো হয়; কাস্টমারকে কি নম্বরে টাকা পাঠাতে হবে ও কি করতে হবে সেটা লিখুন।
  - **Logo URL**: ঐচ্ছিক
  - **Sort Order**: চেকআউটে যে অর্ডারে অপশন দেখাবে।

সেভ করলে স্টোরফ্রন্ট API তে সেই মেথডগুলো `GET /api/ecommerce/payment-methods` এ ফিরে আসবে (শুধু active)।
