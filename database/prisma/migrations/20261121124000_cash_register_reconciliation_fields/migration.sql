-- Additive migration: Cash Register Shift Reconciliation fields
ALTER TABLE `cash_register_sessions`
  ADD COLUMN `closed_by_id` VARCHAR(191) NULL,
  ADD COLUMN `cash_in` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN `cash_out` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN `closing_notes` TEXT NULL;
