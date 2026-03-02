-- Run this in phpMyAdmin (or MySQL) if you get "Failed to create banner. Check that the Banner table exists."
-- Creates Banner and StoredImage tables if missing (safe to run multiple times).

CREATE TABLE IF NOT EXISTS `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `imageData` LONGBLOB NULL,
    `imageMime` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `StoredImage` (
    `id` VARCHAR(191) NOT NULL,
    `data` LONGBLOB NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'image/jpeg',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
