-- AlterTable: add optional manufactured_date and expiry_date to products
ALTER TABLE `products`
  ADD COLUMN `manufactured_date` DATETIME(3) NULL,
  ADD COLUMN `expiry_date` DATETIME(3) NULL;

-- CreateTable: variant_attributes
CREATE TABLE `variant_attributes` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `values` TEXT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `variant_attributes_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: warranties
CREATE TABLE `warranties` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `duration` INTEGER NOT NULL,
  `duration_unit` VARCHAR(191) NOT NULL DEFAULT 'Months',
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `warranties_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: income_categories
CREATE TABLE `income_categories` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `income_categories_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: incomes
CREATE TABLE `incomes` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `category_id` VARCHAR(191) NOT NULL,
  `income_number` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(14, 4) NOT NULL,
  `payment_method` VARCHAR(191) NOT NULL,
  `reference_number` VARCHAR(191) NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `incomes_income_number_key`(`income_number`),
  PRIMARY KEY (`id`),
  CONSTRAINT `incomes_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `incomes_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `income_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: money_transfers
CREATE TABLE `money_transfers` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `from_account_id` VARCHAR(191) NOT NULL,
  `to_account_id` VARCHAR(191) NOT NULL,
  `reference_number` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(14, 4) NOT NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `money_transfers_reference_number_key`(`reference_number`),
  PRIMARY KEY (`id`),
  CONSTRAINT `money_transfers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: quotations
CREATE TABLE `quotations` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `store_id` VARCHAR(191) NOT NULL,
  `customer_id` VARCHAR(191) NULL,
  `quotation_number` VARCHAR(191) NOT NULL,
  `subtotal` DECIMAL(14, 4) NOT NULL,
  `discount_amount` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `tax_amount` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `total_amount` DECIMAL(14, 4) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `valid_until` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `converted_sale_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `quotations_quotation_number_key`(`quotation_number`),
  PRIMARY KEY (`id`),
  CONSTRAINT `quotations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: quotation_items
CREATE TABLE `quotation_items` (
  `id` VARCHAR(191) NOT NULL,
  `quotation_id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL,
  `variant_id` VARCHAR(191) NULL,
  `quantity` DECIMAL(14, 4) NOT NULL,
  `unit_price` DECIMAL(14, 4) NOT NULL,
  `discount_amount` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `tax_amount` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `total_price` DECIMAL(14, 4) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `quotation_items_quotation_id_fkey` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: coupons
CREATE TABLE `coupons` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'PERCENTAGE',
  `value` DECIMAL(14, 4) NOT NULL,
  `min_purchase` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `max_uses` INTEGER NULL,
  `used_count` INTEGER NOT NULL DEFAULT 0,
  `valid_from` DATETIME(3) NULL,
  `valid_until` DATETIME(3) NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `coupons_code_key`(`code`),
  PRIMARY KEY (`id`),
  CONSTRAINT `coupons_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: gift_cards
CREATE TABLE `gift_cards` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `customer_id` VARCHAR(191) NULL,
  `card_number` VARCHAR(191) NOT NULL,
  `initial_balance` DECIMAL(14, 4) NOT NULL,
  `current_balance` DECIMAL(14, 4) NOT NULL,
  `issued_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiry_date` DATETIME(3) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `gift_cards_card_number_key`(`card_number`),
  PRIMARY KEY (`id`),
  CONSTRAINT `gift_cards_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: discount_plans
CREATE TABLE `discount_plans` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `target_customers` VARCHAR(191) NOT NULL DEFAULT 'ALL',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `discount_plans_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: discounts
CREATE TABLE `discounts` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `plan_id` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'PERCENTAGE',
  `value` DECIMAL(14, 4) NOT NULL,
  `valid_from` DATETIME(3) NULL,
  `valid_until` DATETIME(3) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `discounts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `discounts_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `discount_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: departments, designations, shifts, employees, attendances, leave_types, leave_requests, holidays, payrolls
CREATE TABLE `departments` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `departments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `designations` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `designations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shifts` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `start_time` VARCHAR(191) NOT NULL,
  `end_time` VARCHAR(191) NOT NULL,
  `break_minutes` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `shifts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `employees` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `department_id` VARCHAR(191) NULL,
  `designation_id` VARCHAR(191) NULL,
  `shift_id` VARCHAR(191) NULL,
  `emp_code` VARCHAR(191) NOT NULL,
  `first_name` VARCHAR(191) NOT NULL,
  `last_name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `basic_salary` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `join_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `employees_emp_code_key`(`emp_code`),
  PRIMARY KEY (`id`),
  CONSTRAINT `employees_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_designation_id_fkey` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `attendances` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `employee_id` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `clock_in` DATETIME(3) NULL,
  `clock_out` DATETIME(3) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PRESENT',
  `notes` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `attendances_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `attendances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `leave_types` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `days_allowed` INTEGER NOT NULL DEFAULT 12,
  `is_paid` BOOLEAN NOT NULL DEFAULT true,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `leave_types_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `leave_requests` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `employee_id` VARCHAR(191) NOT NULL,
  `leave_type_id` VARCHAR(191) NOT NULL,
  `start_date` DATETIME(3) NOT NULL,
  `end_date` DATETIME(3) NOT NULL,
  `days` INTEGER NOT NULL,
  `reason` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `leave_requests_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `leave_requests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `leave_requests_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `holidays` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `from_date` DATETIME(3) NOT NULL,
  `to_date` DATETIME(3) NOT NULL,
  `description` VARCHAR(191) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `holidays_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payrolls` (
  `id` VARCHAR(191) NOT NULL,
  `company_id` VARCHAR(191) NOT NULL,
  `employee_id` VARCHAR(191) NOT NULL,
  `month` INTEGER NOT NULL,
  `year` INTEGER NOT NULL,
  `basic_salary` DECIMAL(14, 4) NOT NULL,
  `allowances` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `deductions` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  `net_salary` DECIMAL(14, 4) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `payrolls_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payrolls_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
