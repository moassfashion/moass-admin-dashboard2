#!/bin/bash
# Hostinger-এ একবার চালান (প্রজেক্ট রুটে)
# SSH: ssh -p 65002 u410218618@145.79.26.13

set -e
cd "$(dirname "$0")/.."
echo "=== MOASS Admin – Full deploy on Hostinger ==="

# .env তৈরি (নেই থাকলে)
if [ ! -f .env ]; then
  echo "Creating .env..."
  cat > .env << 'ENVFILE'
DATABASE_URL="mysql://u410218618_moass_db:Br46w7tru-UswLSpac0O@localhost:3306/moass_db"
AUTH_SECRET="WmLaYYlJ0m40FImvtWM98SI+GR2j/gYCJh4KZ7lue5A="
ENVFILE
  echo ".env created."
else
  echo ".env exists, skipping."
fi

echo "1. npm install..."
npm install

echo "2. Prisma generate..."
npx prisma generate

echo "3. Prisma migrate deploy..."
npx prisma migrate deploy || true

echo "4. Build..."
npm run build

echo "5. (Optional) Seed admin user - run once: npm run db:seed"
echo "=== Deploy done. Start app: npm start ==="
echo "To run in background: nohup npm start > app.log 2>&1 &"
echo "Or install PM2: npm i -g pm2 && pm2 start npm --name moass -- start"
