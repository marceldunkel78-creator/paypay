# Database Migrations

This directory contains SQL migration files for the Time Account Management application.

## Migration Order

Migrations should be executed in the following order:

1. **001-init.sql** - Initial database setup with users and time_accounts tables
2. **002-time-entries.sql** - Individual time entries system with balance tracking
3. **003-approval-system.sql** - Approval workflow enhancements
4. **004-household-tasks.sql** - Household tasks management system
5. **005-time-entries-task-id.sql** - Link time entries to household tasks

## Automatic Migration

The application automatically runs these migrations on startup through the TypeScript migration scripts in `src/db/migrate-*.ts`.

## Manual Migration

You can also run migrations manually using:

```bash
# Windows
npm run migrate

# Unix/Linux
npm run migrate:unix
```

## Notes

- All migrations are designed to be idempotent (safe to run multiple times)
- The application will automatically detect and run any pending migrations
- Database schema changes should always be done through migrations