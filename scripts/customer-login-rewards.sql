-- Customer login, saved address & rewards – MySQL migration
-- Run this in phpMyAdmin or mysql client. If you use Prisma migrate, run:
--   npx prisma migrate dev --name customer_login_rewards
-- and skip this file. Otherwise run the statements below in order.
--
-- যদি কোনো লাইন চালানোর পর "Duplicate column" বা "Duplicate key" আসে,
-- মানে ওই পরিবর্তন ইতিমধ্যে করা আছে — ওই লাইন এড়িয়ে পরেরটা চালান।

-- 1) Add password and points to Customer
ALTER TABLE `Customer` ADD COLUMN `password` VARCHAR(191) NULL;
ALTER TABLE `Customer` ADD COLUMN `points` INT NOT NULL DEFAULT 0;

-- 2) Make email unique (required for customer login)
-- যদি Customer টেবিলে একই ইমেইল একাধিকবার থাকে, আগে সেটা ঠিক করুন। উদাহরণ:
--   SELECT email, COUNT(*) FROM Customer GROUP BY email HAVING COUNT(*) > 1;
-- এক ইমেইলে একটাই রেকর্ড রেখে বাকি ডিলিট/মার্জ করুন, তারপর নিচের লাইন চালান।
ALTER TABLE `Customer` ADD UNIQUE INDEX `Customer_email_key` (`email`);

-- 3) Create CustomerReward table (রিওয়ার্ড হিস্ট্রি রাখার জন্য)
CREATE TABLE IF NOT EXISTS `CustomerReward` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4) Foreign key (যদি ইতিমধ্যে থাকে তাহলে এই লাইন এড়িয়ে যান)
ALTER TABLE `CustomerReward` ADD CONSTRAINT `CustomerReward_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- শেষে: npx prisma generate
