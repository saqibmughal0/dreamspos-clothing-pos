-- Rollback Migration for 20261114150000_auth_extensions
-- WARNING: Only run if you need to revert the auth extensions migration.

DROP INDEX `users_google_id_key` ON `users`;

ALTER TABLE `users`
  DROP COLUMN `phone`,
  DROP COLUMN `email_verified`,
  DROP COLUMN `google_id`,
  DROP COLUMN `verification_token_hash`,
  DROP COLUMN `verification_token_expires`,
  DROP COLUMN `verification_attempts`,
  DROP COLUMN `verification_sent_at`,
  DROP COLUMN `reset_password_token_hash`,
  DROP COLUMN `reset_password_expires`,
  DROP COLUMN `reset_attempts`,
  DROP COLUMN `reset_sent_at`,
  DROP COLUMN `pending_email`;
