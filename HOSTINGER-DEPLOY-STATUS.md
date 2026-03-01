# Hostinger ডিপ্লয় স্ট্যাটাস

## যা হয়ে গেছে

- SSH দিয়ে কানেক্ট করা হয়েছে (পাসওয়ার্ড দিয়ে)
- প্রজেক্ট আপলোড করা হয়েছে: **`~/moass`** (লোকালে বিল্ড করা `.next` সহ)
- Node 20 পাথ সেট করা: `/opt/alt/alt-nodejs20/root/usr/bin`
- `npm install --omit=dev` সার্ভারে চালানো হয়েছে
- `.env` বানানো হয়েছে (MySQL username: **u410218618_moass_db**)

## আপনার করণীয় (২টা জিনিস)

### ১. সার্ভারে `.env` আপডেট + মাইগ্রেশন চালান

SSH দিয়ে লগইন করে নিচের কমান্ডগুলো চালান (MySQL username ইতিমধ্যে **u410218618_moass_db** সেট করা):

```bash
ssh -p 65002 u410218618@145.79.26.13
# পাসওয়ার্ড: *MOASSprivate#2026

export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH
cd ~/moass

# .env সঠিক username দিয়ে আপডেট (এক লাইনে)
printf '%s\n' 'DATABASE_URL="mysql://u410218618_moass_db:Br46w7tru-UswLSpac0O@localhost:3306/moass_db"' 'AUTH_SECRET="WmLaYYlJ0m40FImvtWM98SI+GR2j/gYCJh4KZ7lue5A="' > .env

# টেবিল তৈরি
npx prisma migrate deploy
```

### ২. অ্যাপ চালু করুন (Hostinger Node.js দিয়ে)

Hostinger-এ Node অ্যাপ চালানোর জন্য **hPanel** ব্যবহার করুন:

1. **hPanel** → **Advanced** → **Node.js** (বা **Applications** → **Node.js**) এ যান।
2. **Add Application** / **Create Application** চাপুন।
3. সেটিংস:
   - **Application root** / **Path:** `moass` (অথবা ফুল পাথ যেমন `~/moass` বা `domains/yourdomain.com/moass` — Hostinger যেটা চায় সেটা দিন)
   - **Node.js version:** 20
   - **Run command:**  
     `npm start`  
     অথবা যদি পাথ লাগে:  
     `export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH && npm start`
   - **Application URL:** আপনার ডোমেইন বা সাবডোমেইন (যেখানে অ্যাপ খুলতে চান)

4. সেভ করে অ্যাপ **Start** করুন।

যদি hPanel এ **Application root** শুধু হোম থেকে রিলেটিভ চায়, তাহলে **Path** হতে পারে: `moass` (কারণ প্রজেক্ট আছে `~/moass` এ)।

---

## সংক্ষেপে

| জিনিস | মান |
|--------|-----|
| সার্ভার | `ssh -p 65002 u410218618@145.79.26.13` |
| প্রজেক্ট পাথ | `~/moass` |
| Node পাথ | `export PATH=/opt/alt/alt-nodejs20/root/usr/bin:$PATH` |
| ডাটাবেস | `moass_db`, user: `u410218618_moass_db`, পাসওয়ার্ড যেটা দিয়েছেন |
| অ্যাপ চালু | hPanel → Node.js দিয়ে `npm start` |

উপরে দেওয়া কমান্ড দিয়ে `.env` আপডেট ও `npx prisma migrate deploy` চালালে টেবিল তৈরি হবে; তারপর hPanel Node.js দিয়ে অ্যাপ স্টার্ট করুন।
