# Database Migrations

This directory contains SQL migration files for the PayPay application database.

## 🚀 Quick Setup Options

### For Fresh Installations (Recommended)
Use the complete setup file that contains everything in one place:

```bash
# Fresh installation - drops existing tables and recreates everything
mysql -u paypay -p time_account_db < complete-setup.sql
```

### For Existing Installations  
Use the incremental update that safely adds missing components:

```bash
# Update existing installation - preserves data
mysql -u paypay -p time_account_db < incremental-update.sql
```

## 📁 Migration Files

### 🆕 Unified Migration Files
- **`complete-setup.sql`** - Complete database setup for fresh installations
- **`incremental-update.sql`** - Safe updates for existing installations

### 📊 Individual Migration Files (Legacy)
1. `001-init.sql` - Core tables (users, time_accounts)
2. `002-time-entries.sql` - Time entries table (without task_id)
3. `003-approval-system.sql` - Approval workflow extensions
4. `004-household-tasks.sql` - Household tasks table
5. `005-time-entries-task-id.sql` - Links time entries to household tasks
6. `006-weight-factors.sql` - Adds weight factors and input tracking for flexible time calculation
- `run-migrations-in-order.sql` - Executes individual files in correct order

## ✅ What's Included

The complete setup includes:
- ✅ **User Management**: Registration, approval workflow, email notifications
- ✅ **Time Tracking**: Individual time entries with positive/negative values
- ✅ **Household Tasks**: Predefined tasks with fixed time rewards  
- ✅ **Approval System**: Admin approval for time entries
- ✅ **Balance Tracking**: Automatic balance calculation with triggers
- ✅ **Database Integrity**: Foreign key constraints and indexes

## 🔧 Manual Migration (Development)

For development, you can still run individual migrations:

```bash
# Windows  
npm run migrate

# Unix/Linux
npm run migrate:unix
```

## 🔍 Database Schema Overview

```
users (id, username, password, email, role, is_approved)
├── time_accounts (user_id FK)
├── time_entries (user_id FK, task_id FK, approved_by FK, input_minutes, calculated_hours)
│   └── household_tasks (task_id FK, hours, weight_factor, description)
└── user_time_balance (user_id FK)
```

### New Weight Factor System (Migration 006)
- **Reference Hours**: Original estimated time for the task
- **Weight Factor**: Multiplier for actual input (0.6 - 1.5)
- **Input Minutes**: User's actual time spent
- **Calculated Hours**: input_minutes × weight_factor = credited time

## ⚠️ Important Notes

- **Fresh installations**: Use `complete-setup.sql` - it's faster and cleaner
- **Existing databases**: Use `incremental-update.sql` - it preserves your data
- **Development**: Individual migration files are still available for testing
- **Production**: Always backup your database before running migrations