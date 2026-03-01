# Hostinger ডিপ্লয় রেডিনেস রিপোর্ট

প্রজেক্ট Hostinger এ ডিপ্লয়ের জন্য **প্রায় পুরোপুরি রেডি**। নিচে চেকলিস্ট ও নোট।

---

## ✅ যা ইতিমধ্যে ঠিক আছে

| বিষয় | স্ট্যাটাস |
|--------|-----------|
| **ডাটাবেস** | Prisma schema এ `mysql` সেট, Hostinger MySQL ব্যবহারের জন্য উপযুক্ত |
| **Environment** | `DATABASE_URL` ও `AUTH_SECRET` env দিয়ে নেওয়া হয়, কোডে হার্ডকোড নেই |
| **প্রোডাকশন সিকিউরিটি** | `AUTH_SECRET` প্রোডে "change-me" থাকলে অ্যাপ ক্র্যাশ করবে (auth.ts) |
| **কুকি** | প্রোডে `secure: true`, HTTPS এ সেশন সেফ |
| **বিল্ড স크립্ট** | `npm run build` = `prisma generate && next build`, সঠিক |
| **স্টার্ট** | `npm start` = `next start`, স্ট্যান্ডার্ড |
| **লোকালহোস্ট** | API/অ্যাপ কোডে localhost হার্ডকোড নেই |
| **আপলোড প্রটেকশন** | `/api/upload` রাউটে `requireUser()` দিয়ে অথেন্টিকেশন চেক হয় |
| **মাইগ্রেশন** | MySQL মাইগ্রেশন + `scripts/hostinger-create-tables.sql` আছে |

---

## ⚠️ ডিপ্লয়ের আগে যা করতেই হবে

1. **`.env` (Hostinger এ)**  
   - `DATABASE_URL` = Hostinger MySQL connection string  
   - `AUTH_SECRET` = নিজে জেনারেট করা মান (`openssl rand -base64 32`), **"change-me" রাখবেন না**

2. **মাইগ্রেশন / টেবিল**  
   - হয় `npx prisma migrate deploy`  
   - অথবা phpMyAdmin এ `scripts/hostinger-create-tables.sql` ইম্পোর্ট +  
     `npx prisma migrate resolve --applied "20260302000000_init"`

3. **নোড ভার্সন**  
   - Hostinger এ Node **18** বা **20** সিলেক্ট করুন। চাইলে `package.json` এ যোগ করুন: `"engines": { "node": ">=18" }`।

---

## 📌 যা খেয়াল রাখবেন (সমস্যা নয়, সচেতনতা)

| বিষয় | বিবরণ |
|--------|--------|
| **ফাইল আপলোড** | ইমেজ `public/uploads` এ সেভ হয়। কোনো রিডিপ্লয়/রিবিল্ডে এই ফোল্ডার রিসেট হতে পারে। দীর্ঘমেয়াদে চাইলে Hostinger Object Storage বা বাহিরের স্টোরেজ ব্যবহার করা ভালো। |
| **প্ল্যান** | Hostinger এ Node.js অ্যাপ চালাতে **Business Web Hosting** বা **Cloud** প্ল্যান লাগে (শেয়ার্ড স্ট্যান্ডার্ডে Node অ্যাপ রান হয় না)। |
| **HTTPS** | ডোমেইনে SSL চালু রাখুন; প্রোডে সেশন কুকি শুধু HTTPS এ সেফ। |

---

## 🚀 Hostinger এ ডিপ্লয় স্টেপ (সংক্ষেপে)

1. Hostinger hPanel → **Node.js** সেকশন থেকে অ্যাপ অ্যাড করুন (Git বা জিপ আপলোড)।
2. **Build command:** `npm run build`  
   **Run command:** `npm start`  
   (অটো ডিটেক্ট হলে ঠিক থাকবে।)
3. **Environment variables** সেকশনে `DATABASE_URL` ও `AUTH_SECRET` সেট করুন।
4. MySQL ডাটাবেস আগে থেকে ক্রিয়েট করে টেবিল/মাইগ্রেশন রান করুন (উপরে বলা ধাপ অনুযায়ী)।
5. ডিপ্লয় পর প্রথম অ্যাডমিন: `/auth/v2/register` দিয়ে রেজিস্টার অথবা `npm run db:seed` চালিয়ে সিড ইউজার দিয়ে লগইন।

বিস্তারিত: `HOSTINGER-SETUP.md`।

---

## চেকলিস্ট (কপি করে ব্যবহার করুন)

- [ ] Hostinger প্ল্যানে Node.js সাপোর্ট আছে (Business/Cloud)
- [ ] MySQL ডাটাবেস ক্রিয়েট ও `DATABASE_URL` সেট
- [ ] `AUTH_SECRET` সেট (টেমপ্লেট মান না)
- [ ] টেবিল তৈরি (migrate অথবা hostinger-create-tables.sql)
- [ ] Build = `npm run build`, Start = `npm start`
- [ ] (ঐচ্ছিক) `db:seed` অথবা প্রথম ইউজার রেজিস্টার
- [ ] ডোমেইনে HTTPS চালু

**সারাংশ:** প্রজেক্ট Hostinger এ ডিপ্লয়ের জন্য রেডি; শুধু env ভেরিয়েবল ও MySQL সেটআপ সঠিকভাবে করলেই হবে।
