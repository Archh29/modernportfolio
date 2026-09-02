USE velzadb;

-- Idempotent seed: one shared set of categories, owned by no individual user.
INSERT INTO categories (user_id, name, type, is_system) VALUES
  (NULL, 'Salary', 'income', TRUE),
  (NULL, 'Freelance', 'income', TRUE),
  (NULL, 'Business', 'income', TRUE),
  (NULL, 'Gift', 'income', TRUE),
  (NULL, 'Other Income', 'income', TRUE),
  (NULL, 'Food', 'expense', TRUE),
  (NULL, 'Transportation', 'expense', TRUE),
  (NULL, 'Bills', 'expense', TRUE),
  (NULL, 'Housing', 'expense', TRUE),
  (NULL, 'Shopping', 'expense', TRUE),
  (NULL, 'Entertainment', 'expense', TRUE),
  (NULL, 'Health', 'expense', TRUE),
  (NULL, 'Education', 'expense', TRUE),
  (NULL, 'Subscriptions', 'expense', TRUE),
  (NULL, 'Personal', 'expense', TRUE),
  (NULL, 'Other', 'expense', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
