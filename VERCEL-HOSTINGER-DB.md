# Vercel-এ Hostinger ডাটাবেস যুক্ত করা

Vercel-এ deploy করা অ্যাপ যখন Hostinger-এর MySQL ব্যবহার করবে, তখন কানেকশন **ইন্টারনেট দিয়ে** হবে। তাই Hostinger-এ **Remote MySQL** চালু করতে হবে।

---

## ধাপ ১: Hostinger-এ Remote MySQL চালু করুন

1. **Hostinger hPanel** এ লগইন করুন।
2. বাম পাশে **Databases** → **Remote MySQL** এ যান।
3. পৃষ্ঠার ওপরে **MySQL server hostname** টা নোট করে রাখুন (যেমন: `srv123.hostinger.com`) — এটা পরবর্তীতে `DATABASE_URL`-এ **host** হিসেবে দেবেন।
4. **Create** সেকশনে:
   - **Any Host** চেকবক্স টিক দিন (যেকোনো IP থেকে কানেকশন allow করবে — Vercel serverless অনেক IP থেকে রিকোয়েস্ট করে তাই সাধারণত Any Host দিতে হয়)
   - **Database** ড্রপডাউন থেকে আপনার যে ডাটাবেস ব্যবহার করবেন সেটা সিলেক্ট করুন
   - **Create** ক্লিক করুন

এখন বাইরের সার্ভার (Vercel) থেকে এই ডাটাবেসে কানেকশন করা যাবে।

---

## ধাপ ২: Hostinger থেকে ডাটাবেসের তথ্য নিন

**Databases** → **MySQL Databases** এ গিয়ে নোট করুন:

| মান | কোথায় পাবেন |
|-----|----------------|
| **Host** | Remote MySQL পৃষ্ঠার ওপরে লেখা **MySQL server hostname** (localhost নয়) |
| **Database name** | আপনার ডাটাবেসের নাম (যেমন: `u123456789_moass`) |
| **Username** | ডাটাবেস ইউজারনেম (যেমন: `u123456789_admin`) |
| **Password** | সেই ইউজারের পাসওয়ার্ড |
| **Port** | `3306` (ডিফল্ট) |

**Connection string** ফরম্যাট:

```
mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME
```

**উদাহরণ:**

```
mysql://u123456789_admin:YourPassword@srv123.hostinger.com:3306/u123456789_moass
```

**সতর্কতা:** পাসওয়ার্ডে `#`, `@`, `%` ইত্যাদি থাকলে URL-এ encode করুন (যেমন `#` → `%23`, `@` → `%40`)।

---

## ধাপ ৩: Vercel-এ Environment Variables দিন

1. [Vercel Dashboard](https://vercel.com/dashboard) এ যান।
2. আপনার **প্রজেক্ট** সিলেক্ট করুন (MOASS Admin Dashboard)।
3. উপরে **Settings** ট্যাবে ক্লিক করুন।
4. বাম পাশে **Environment Variables** এ ক্লিক করুন।
5. নিচের দুটো ভেরিয়েবল **Add** করুন:

| Name | Value | Environment |
|------|--------|-------------|
| `DATABASE_URL` | `mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME` (ধাপ ২-এর মান দিয়ে পূরণ করুন) | Production (এবং চাইলে Preview, Development) |
| `AUTH_SECRET` | নিজে জেনারেট করা র‍্যান্ডম স্ট্রিং (নিচে দেখুন) | Production (এবং চাইলে Preview, Development) |

**AUTH_SECRET জেনারেট:** টার্মিনালে চালান:

```bash
openssl rand -base64 32
```

যে মানটা আসবে সেটা কপি করে `AUTH_SECRET`-এর value হিসেবে পেস্ট করুন। **"change-me" বা টেমপ্লেট মান ব্যবহার করবেন না।**

6. **Save** করুন।
7. **পরিবর্তন কার্যকর করতে:** একবার নতুন **Redeploy** করুন (Deployments → লেটেস্ট ডিপ্লয়ের ডান পাশে ⋮ → Redeploy)।

---

## ধাপ ৪: ডাটাবেসে টেবিল আছে কিনা নিশ্চিত করুন

টেবিল আগে থেকে না থাকলে:

- **Hostinger phpMyAdmin** এ লগইন করুন → আপনার ডাটাবেস সিলেক্ট করুন → **Import** → প্রজেক্টের `scripts/hostinger-create-tables.sql` ফাইল দিয়ে ইম্পোর্ট করুন।
- অথবা লোকাল থেকে সেই Hostinger ডাটাবেসের জন্য একবার `npx prisma migrate deploy` চালান (লোকাল `.env`-এ Hostinger-এর `DATABASE_URL` দিয়ে)।

প্রথম অ্যাডমিন ইউজার চাইলে একবার `npm run db:seed` চালান (লোকালে একই `DATABASE_URL` দিয়ে), অথবা Vercel সাইটে গিয়ে `/auth/v2/register` দিয়ে রেজিস্টার করুন।

---

## সংক্ষিপ্ত চেকলিস্ট

- [ ] Hostinger-এ Remote MySQL চালু (Any Host + ডাটাবেস সিলেক্ট)
- [ ] MySQL server hostname নোট করা (localhost নয়)
- [ ] Vercel-এ `DATABASE_URL` সেট (host = সেই hostname)
- [ ] Vercel-এ `AUTH_SECRET` সেট (জেনারেট করা মান)
- [ ] ডাটাবেসে টেবিল আছে (migrate বা SQL ইম্পোর্ট)
- [ ] Redeploy করা হয়েছে
- [ ] লগইন টেস্ট (`/auth/v2/login` বা `/auth/v2/register`)

---

**সমস্যা:** "Can't reach database" এলে — Remote MySQL ঠিকমতো চালু কিনা, host নাম সঠিক কিনা (localhost না), এবং পাসওয়ার্ডে বিশেষ ক্যারেক্টার encode করা আছে কিনা চেক করুন।
