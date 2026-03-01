-- AlterTable: store banner image in MySQL (LONGBLOB) instead of filesystem
ALTER TABLE `Banner` MODIFY COLUMN `image` VARCHAR(191) NULL;
ALTER TABLE `Banner` ADD COLUMN `imageData` LONGBLOB NULL;
ALTER TABLE `Banner` ADD COLUMN `imageMime` VARCHAR(191) NULL;
