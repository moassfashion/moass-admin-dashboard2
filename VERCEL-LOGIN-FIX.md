# Vercel এ Login / PrismaClientInitializationError ফিক্স

`PrismaClientInitializationError: Invalid prisma...` বা **"User was denied access on the database \`moass_db\`"** বা লগইন/রেজিস্টার ৫০০ এরর এলে নিচের স্টেপগুলো চেক করুন।

---

## ১. ডাটাবেসের নাম ঠিক করুন (জরুরি)

**"User was denied access on the database `moass_db`"** মানে Vercel-এ `DATABASE_URL` এ ডাটাবেস নাম **`moass_db`** দেওয়া আছে, কিন্তু Hostinger-এ আপনার MySQL ইউজারের অ্যাক্সেস আছে **অন্য ডাটাবেসে** (যেখানে আপনি phpMyAdmin এ টেবিল বানিয়েছেন)। দুটো **একই** হতে হবে।

phpMyAdmin এ আপনার ডাটাবেসের নাম **বাম পাশে যেটা দেখাচ্ছে** সেটাই ব্যবহার করতে হবে।

- Hostinger phpMyAdmin-এ বাম পাশে যে **ডাটাবেসের নাম** দেখাচ্ছে সেটাই ব্যবহার করুন।
- আগে URL এ ভুল নাম (যেমন শুধু `moass_db`) থাকতে পারে।

তাই Vercel এ `DATABASE_URL` এ **ডাটাবেসের নাম** অংশটা Hostinger-এ যেটা দেখাচ্ছে সেটাই দিন।

**সঠিক ফরম্যাট (placeholders আপনার Hostinger MySQL মান দিয়ে প্রতিস্থাপন করুন):**

```
mysql://YOUR_MYSQL_USER:YOUR_MYSQL_PASSWORD@YOUR_MYSQL_HOST:3306/YOUR_DATABASE_NAME
```

খেয়াল রাখুন: ইউজারনেম ও ডাটাবেস নাম দুটোই Hostinger MySQL Databases পেজে যেরকম সেটা সেরকম দিন।

---

## ২. Vercel Environment Variables চেক করুন

1. **Vercel Dashboard** → আপনার প্রজেক্ট → **Settings** → **Environment Variables**
2. **DATABASE_URL**:
   - **Name:** `DATABASE_URL`
   - **Value:** উপরের পুরো স্ট্রিং টা (কোনো অতিরিক্ত স্পেস বা কোটেশন ছাড়া)
   - **Environments:** **Production** এবং **Preview** দুটোতেই টিক দিন
3. **AUTH_SECRET** ও সেট আছে কিনা দেখুন (কোনো র‍্যান্ডম স্ট্রিং, যেমন `openssl rand -base64 32` দিয়ে বানানো)।
4. **Save** করুন। পরিবর্তন করার পর **Redeploy** করুন (Deployments → ⋮ → Redeploy)।

---

## ৩. পাসওয়ার্ডে বিশেষ ক্যারেক্টার থাকলে

পাসওয়ার্ডে `#`, `@`, `%`, `?` ইত্যাদি থাকলে URL এ **encode** করতে হবে।  
উদাহরণ: `#` → `%23`, `@` → `%40`।  
আপনার পাসওয়ার্ডে শুধু অক্ষর ও সংখ্যা থাকলে এটা লাগবে না।

---

## ৪. Serverless এর জন্য connection_limit (ঐচ্ছিক)

কোনো কারণে কানেকশন লিমিট এরর এলে URL এর শেষে যোগ করতে পারেন:

```
?connection_limit=1
```

পুরো উদাহরণ (placeholders আপনার মান দিয়ে প্রতিস্থাপন করুন):

```
mysql://YOUR_MYSQL_USER:YOUR_MYSQL_PASSWORD@YOUR_MYSQL_HOST:3306/YOUR_DATABASE_NAME?connection_limit=1
```

---

## ৫. সংক্ষিপ্ত চেকলিস্ট

- [ ] Hostinger MySQL Databases থেকে **exact** database name ও username নিয়ে `DATABASE_URL` বানানো
- [ ] Vercel এ `DATABASE_URL` ও `AUTH_SECRET` সেট করা, value তে কোটেশন বা স্পেস নেই
- [ ] Production (ও চাইলে Preview) এ env সিলেক্ট করা
- [ ] env সেভ করার পর **Redeploy** করা
- [ ] Hostinger এ **Remote MySQL** চালু আছে (Any Host অ্যাড করা)

---

## ৬. Prisma Vercel বিল্ড ফিক্স (একই Prisma এরর থাকলে)

যদি একই `PrismaClientInitializationError` আবারও আসে:

1. **প্রজেক্টে ইতিমধ্যে করা হয়েছে:**
   - `prisma/schema.prisma` এ **binaryTargets** যোগ করা হয়েছে (`rhel-openssl-3.0.x`) যাতে Vercel-এর সার্ভারে Prisma ইঞ্জিন চলে।
   - **prisma** প্যাকেজ **dependencies** এ নিয়ে আসা হয়েছে যাতে বিল্ডের সময় `prisma generate` চলে।

2. **আপনার করণীয়:**
   - এই পরিবর্তনগুলো **কমিট করে পুশ** করুন (GitHub/GitLab)।
   - Vercel অটো ডিপ্লয় করলে নতুন বিল্ড হবে। না হলে **Redeploy** ট্রিগার করুন।
   - রিডিপ্লয়ের পর আবার লগইন চেষ্টা করুন।

এইগুলো ঠিক থাকলে সাধারণত `PrismaClientInitializationError` ও লগইন ৫০০ চলে যায়।
