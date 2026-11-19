-- Corrective migration: scope document/code UNIQUE indexes per company_id
-- Non-destructive index replacement only; preserves all existing rows.

ALTER TABLE `incomes`
  DROP INDEX `incomes_income_number_key`,
  ADD UNIQUE INDEX `incomes_company_id_income_number_key`(`company_id`, `income_number`);

ALTER TABLE `money_transfers`
  DROP INDEX `money_transfers_reference_number_key`,
  ADD UNIQUE INDEX `money_transfers_company_id_reference_number_key`(`company_id`, `reference_number`);

ALTER TABLE `quotations`
  DROP INDEX `quotations_quotation_number_key`,
  ADD UNIQUE INDEX `quotations_company_id_quotation_number_key`(`company_id`, `quotation_number`);

ALTER TABLE `coupons`
  DROP INDEX `coupons_code_key`,
  ADD UNIQUE INDEX `coupons_company_id_code_key`(`company_id`, `code`);

ALTER TABLE `gift_cards`
  DROP INDEX `gift_cards_card_number_key`,
  ADD UNIQUE INDEX `gift_cards_company_id_card_number_key`(`company_id`, `card_number`);

ALTER TABLE `employees`
  DROP INDEX `employees_emp_code_key`,
  ADD UNIQUE INDEX `employees_company_id_emp_code_key`(`company_id`, `emp_code`);
