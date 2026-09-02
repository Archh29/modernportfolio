-- Velza personal-finance database (MySQL 8.0.16+)
-- Run once: mysql -u <user> -p < database/001_velza_schema.sql
-- All money is DECIMAL(15,2); balance caches must only be changed by a
-- transaction service in the application, in the same DB transaction as ledger writes.

CREATE DATABASE IF NOT EXISTS velzadb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE velzadb;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB;

CREATE TABLE accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  credit_limit DECIMAL(15,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  description VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT accounts_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT accounts_type_check CHECK (type IN ('cash', 'bank', 'ewallet', 'credit_card')),
  CONSTRAINT accounts_credit_limit_check CHECK (credit_limit IS NULL OR credit_limit >= 0),
  KEY accounts_user_active_index (user_id, is_active)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  parent_id BIGINT UNSIGNED NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL,
  icon VARCHAR(50) NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  owner_scope_id BIGINT UNSIGNED AS (COALESCE(user_id, 0)) STORED,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT categories_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT categories_parent_fk FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense')),
  CONSTRAINT categories_owner_check CHECK (
    (is_system = TRUE AND user_id IS NULL) OR (is_system = FALSE AND user_id IS NOT NULL)
  ),
  UNIQUE KEY categories_owner_name_type_unique (owner_scope_id, name, type),
  KEY categories_user_type_index (user_id, type)
) ENGINE=InnoDB;

CREATE TABLE recurring_rules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  frequency VARCHAR(10) NOT NULL,
  interval_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  template_type VARCHAR(10) NOT NULL,
  template_account_id BIGINT UNSIGNED NULL,
  template_category_id BIGINT UNSIGNED NULL,
  template_amount DECIMAL(15,2) NOT NULL,
  template_name VARCHAR(100) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT recurring_rules_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT recurring_rules_account_fk FOREIGN KEY (template_account_id) REFERENCES accounts(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT recurring_rules_category_fk FOREIGN KEY (template_category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT recurring_rules_frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  CONSTRAINT recurring_rules_template_type_check CHECK (template_type IN ('transaction', 'due')),
  CONSTRAINT recurring_rules_interval_check CHECK (interval_count > 0),
  CONSTRAINT recurring_rules_amount_check CHECK (template_amount > 0),
  CONSTRAINT recurring_rules_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
  KEY recurring_rules_schedule_index (user_id, is_active, start_date)
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  destination_account_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  type VARCHAR(10) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(255) NULL,
  due_id BIGINT UNSIGNED NULL,
  recurring_rule_id BIGINT UNSIGNED NULL,
  savings_goal_id BIGINT UNSIGNED NULL,
  debt_id BIGINT UNSIGNED NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT transactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT transactions_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT transactions_destination_account_fk FOREIGN KEY (destination_account_id) REFERENCES accounts(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT transactions_category_fk FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT transactions_amount_check CHECK (amount > 0),
  CONSTRAINT transactions_shape_check CHECK (
    (type IN ('income', 'expense') AND destination_account_id IS NULL AND category_id IS NOT NULL)
    OR
    (type = 'transfer' AND destination_account_id IS NOT NULL AND category_id IS NULL
      AND account_id <> destination_account_id)
  ),
  KEY transactions_user_date_index (user_id, transaction_date),
  KEY transactions_account_date_index (account_id, transaction_date),
  KEY transactions_user_type_date_index (user_id, type, transaction_date),
  KEY transactions_user_category_date_index (user_id, category_id, transaction_date),
  KEY transactions_due_index (due_id),
  KEY transactions_recurring_rule_index (recurring_rule_id),
  KEY transactions_savings_goal_index (savings_goal_id),
  KEY transactions_debt_index (debt_id)
) ENGINE=InnoDB;

CREATE TABLE budgets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  amount DECIMAL(15,2) NOT NULL,
  period VARCHAR(10) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT budgets_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT budgets_category_fk FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT budgets_amount_check CHECK (amount > 0),
  CONSTRAINT budgets_period_check CHECK (period = 'monthly'),
  CONSTRAINT budgets_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
  KEY budgets_user_category_start_index (user_id, category_id, start_date)
) ENGINE=InnoDB;

CREATE TABLE dues (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  is_variable BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP NULL,
  recurring_rule_id BIGINT UNSIGNED NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT dues_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dues_recurring_rule_fk FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT dues_amount_check CHECK (amount > 0),
  KEY dues_user_date_index (user_id, due_date),
  KEY dues_user_paid_date_index (user_id, paid_at, due_date)
) ENGINE=InnoDB;

CREATE TABLE savings_goals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  target_date DATE NULL,
  linked_account_id BIGINT UNSIGNED NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT savings_goals_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT savings_goals_account_fk FOREIGN KEY (linked_account_id) REFERENCES accounts(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT savings_goals_target_check CHECK (target_amount > 0),
  CONSTRAINT savings_goals_current_check CHECK (current_amount >= 0),
  KEY savings_goals_user_index (user_id)
) ENGINE=InnoDB;

CREATE TABLE debts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  remaining_balance DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NULL,
  due_day TINYINT UNSIGNED NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT debts_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT debts_principal_check CHECK (principal_amount > 0),
  CONSTRAINT debts_remaining_check CHECK (remaining_balance >= 0),
  CONSTRAINT debts_interest_check CHECK (interest_rate IS NULL OR interest_rate >= 0),
  CONSTRAINT debts_due_day_check CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31),
  KEY debts_user_index (user_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL,
  message VARCHAR(255) NOT NULL,
  related_type VARCHAR(50) NULL,
  related_id BIGINT UNSIGNED NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT notifications_related_check CHECK (
    (related_type IS NULL AND related_id IS NULL) OR (related_type IS NOT NULL AND related_id IS NOT NULL)
  ),
  KEY notifications_user_read_index (user_id, read_at),
  KEY notifications_related_index (related_type, related_id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id BIGINT UNSIGNED NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT attachments_transaction_fk FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT attachments_file_size_check CHECK (file_size > 0),
  KEY attachments_transaction_index (transaction_id)
) ENGINE=InnoDB;

-- These are added after dues, savings_goals, and debts to break the schema cycle.
ALTER TABLE transactions
  ADD CONSTRAINT transactions_due_fk FOREIGN KEY (due_id) REFERENCES dues(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT transactions_recurring_rule_fk FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT transactions_savings_goal_fk FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT transactions_debt_fk FOREIGN KEY (debt_id) REFERENCES debts(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
