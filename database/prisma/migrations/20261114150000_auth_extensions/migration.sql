-- AlterTable
ALTER TABLE `users` 
  ADD COLUMN `phone` VARCHAR(191) NULL,
  ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `google_id` VARCHAR(191) NULL,
  ADD COLUMN `verification_token_hash` VARCHAR(191) NULL,
  ADD COLUMN `verification_token_expires` DATETIME(3) NULL,
  ADD COLUMN `verification_attempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN `verification_sent_at` DATETIME(3) NULL,
  ADD COLUMN `reset_password_token_hash` VARCHAR(191) NULL,
  ADD COLUMN `reset_password_expires` DATETIME(3) NULL,
  ADD COLUMN `reset_attempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN `reset_sent_at` DATETIME(3) NULL,
  ADD COLUMN `pending_email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_google_id_key` ON `users`(`google_id`);
