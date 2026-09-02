# Velza MySQL database

This is a MySQL 8.0.16+ implementation of the database architecture you supplied. It is kept independent of the current Next.js frontend, so it can be used by a Laravel API or another backend later.

Run the schema, then the system-category seed:

```powershell
mysql -u YOUR_USER -p < database/001_velza_schema.sql
mysql -u YOUR_USER -p velzadb < database/002_system_categories.sql
```

If the API will be Laravel, then also run its support-table script (or use Laravel's own generated migrations instead):

```powershell
mysql -u YOUR_USER -p velzadb < database/003_laravel_support.sql
```

The schema contains the MVP tables and the planned recurring rules, savings goals, debts, notifications, and receipt attachments. It also includes the recommended foreign keys, soft-delete columns, composite reporting indexes, and MySQL checks for amounts, transfer shape, and valid status-like values.

Important application rules that require the authenticated user or related-table ownership remain the backend's responsibility: scope every user-owned query by `user_id`; ensure accounts, categories, dues, goals, and debts belong to the transaction's user; and update `accounts.balance`, `savings_goals.current_amount`, and `debts.remaining_balance` only through one database transaction with the ledger change.

The `notifications` relation is intentionally polymorphic (`related_type`, `related_id`), so MySQL cannot enforce its target foreign key. Validate it in the backend.

`002_system_categories.sql` is idempotent. The categories table uses a generated owner-scope key so the unique constraint protects both user categories and the shared (`user_id IS NULL`) system categories.

## MariaDB client

Do not paste individual blocks from the middle of the schema into the MariaDB prompt. The tables have foreign-key dependencies and must be created in order. From the MariaDB prompt, run the whole file instead:

```sql
SOURCE C:/Users/uygua/modernportfolio/database/001_velza_schema.sql;
SOURCE C:/Users/uygua/modernportfolio/database/002_system_categories.sql;
```

The schema creates and selects `velzadb` automatically. If a previous partial attempt created tables in this *test-only* database, start over only after confirming no data needs to be kept:

```sql
DROP DATABASE velzadb;
SOURCE C:/Users/uygua/modernportfolio/database/001_velza_schema.sql;
SOURCE C:/Users/uygua/modernportfolio/database/002_system_categories.sql;
```
