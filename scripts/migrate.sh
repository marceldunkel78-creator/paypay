#!/bin/bash

# This script runs the database migrations for the time account application.

# Navigate to the directory containing the SQL migration files
cd src/db/migrations

# Execute the SQL migration file to initialize the database
mysql -u <username> -p<password> <database_name> < 001-init.sql

# Print a message indicating that the migration was successful
echo "Database migration completed successfully."