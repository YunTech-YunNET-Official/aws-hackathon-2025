-- CreateTable
CREATE TABLE `processed_data` (
    `客代` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`客代`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_attributes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `客代` INTEGER NOT NULL,
    `屬性名稱` VARCHAR(191) NOT NULL,
    `值` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customer_attributes` ADD CONSTRAINT `customer_attributes_客代_fkey` FOREIGN KEY (`客代`) REFERENCES `processed_data`(`客代`) ON DELETE RESTRICT ON UPDATE CASCADE;
