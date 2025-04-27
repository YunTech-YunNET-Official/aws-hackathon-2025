/*
  Warnings:

  - You are about to drop the column `值` on the `customer_attributes` table. All the data in the column will be lost.
  - You are about to drop the column `客代` on the `customer_attributes` table. All the data in the column will be lost.
  - You are about to drop the column `屬性名稱` on the `customer_attributes` table. All the data in the column will be lost.
  - You are about to drop the `processed_data` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attribute` to the `customer_attributes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_id` to the `customer_attributes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `customer_attributes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `customer_attributes` DROP FOREIGN KEY `customer_attributes_客代_fkey`;

-- DropIndex
DROP INDEX `customer_attributes_客代_fkey` ON `customer_attributes`;

-- AlterTable
ALTER TABLE `customer_attributes` DROP COLUMN `值`,
    DROP COLUMN `客代`,
    DROP COLUMN `屬性名稱`,
    ADD COLUMN `attribute` VARCHAR(191) NOT NULL,
    ADD COLUMN `customer_id` INTEGER NOT NULL,
    ADD COLUMN `value` TEXT NOT NULL;

-- DropTable
DROP TABLE `processed_data`;

-- CreateTable
CREATE TABLE `customers` (
    `customer_id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `prompt` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customer_attributes` ADD CONSTRAINT `customer_attributes_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
