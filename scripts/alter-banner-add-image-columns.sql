-- Run this in phpMyAdmin if Banner table exists but banner create still fails.
-- Adds missing columns imageData and imageMime (required by Prisma).
-- If you get "Duplicate column name", the columns already exist — skip or ignore.

ALTER TABLE `Banner` ADD COLUMN `imageData` LONGBLOB NULL AFTER `image`;
ALTER TABLE `Banner` ADD COLUMN `imageMime` VARCHAR(191) NULL AFTER `imageData`;
