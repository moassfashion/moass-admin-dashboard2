-- CreateTable: implicit many-to-many join (Prisma: A = Category, B = Product)
CREATE TABLE `_CategoryToProduct` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CategoryToProduct_AB_unique`(`A`, `B`),
    INDEX `_CategoryToProduct_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate existing product->category into join table
INSERT INTO `_CategoryToProduct` (`A`, `B`)
SELECT `categoryId`, `id` FROM `Product` WHERE `categoryId` IS NOT NULL;

-- Ensure "Uncategorized" category exists (insert only if slug not present)
INSERT INTO `Category` (`id`, `name`, `slug`, `sortOrder`, `createdAt`, `updatedAt`)
SELECT CONCAT('c', SUBSTRING(REPLACE(UUID(), '-', ''), 1, 24)), 'Uncategorized', 'uncategorized', 9999, NOW(3), NOW(3)
FROM DUAL
WHERE (SELECT COUNT(*) FROM `Category` WHERE `slug` = 'uncategorized') = 0;

-- Assign products with no category to Uncategorized
INSERT INTO `_CategoryToProduct` (`A`, `B`)
SELECT c.`id`, p.`id`
FROM `Product` p
INNER JOIN `Category` c ON c.`slug` = 'uncategorized'
WHERE p.`id` NOT IN (SELECT `B` FROM `_CategoryToProduct`);

-- Drop old FK and column
ALTER TABLE `Product` DROP FOREIGN KEY `Product_categoryId_fkey`;
ALTER TABLE `Product` DROP COLUMN `categoryId`;

-- Add FKs for join table
ALTER TABLE `_CategoryToProduct` ADD CONSTRAINT `_CategoryToProduct_A_fkey` FOREIGN KEY (`A`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `_CategoryToProduct` ADD CONSTRAINT `_CategoryToProduct_B_fkey` FOREIGN KEY (`B`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
