-- Payment methods and Order payment fields (MySQL)
-- Run in phpMyAdmin or mysql client. Then: npx prisma generate (and optionally migrate resolve if using migrations).

-- PaymentMethod table
CREATE TABLE IF NOT EXISTS `PaymentMethod` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `accountNumber` VARCHAR(191) NULL,
    `instructions` TEXT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add payment columns to Order (skip these if columns already exist)
ALTER TABLE `Order` ADD COLUMN `paymentMethodId` VARCHAR(191) NULL;
ALTER TABLE `Order` ADD COLUMN `transactionId` VARCHAR(191) NULL;
ALTER TABLE `Order` ADD COLUMN `senderNumber` VARCHAR(191) NULL;

-- Add FK for paymentMethodId (if you get duplicate key error, constraint already exists)
ALTER TABLE `Order` ADD CONSTRAINT `Order_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `PaymentMethod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
