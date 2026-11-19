-- CreateTable: billers
CREATE TABLE `billers` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `company_name` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL DEFAULT 'Pakistan',
  `tax_number` VARCHAR(191) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `billers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
