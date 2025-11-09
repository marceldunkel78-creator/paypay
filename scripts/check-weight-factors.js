require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkWeightFactors() {
    // Parse DATABASE_URL if available
    const databaseUrl = process.env.DATABASE_URL;
    let config;
    
    if (databaseUrl) {
        const url = new URL(databaseUrl);
        config = {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1),
            port: parseInt(url.port) || 3306
        };
    } else {
        config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'time_account_db',
            port: 3306
        };
    }

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to database');

        // Check current weight factors
        const [rows] = await connection.execute('SELECT id, name, hours, weight_factor FROM household_tasks ORDER BY id');
        
        console.log('Current household tasks:');
        console.log('ID | Name | Hours | Weight Factor');
        console.log('---|------|-------|-------------');
        
        for (const row of rows) {
            console.log(`${row.id.toString().padEnd(2)} | ${row.name.padEnd(20)} | ${row.hours.toString().padEnd(5)} | ${row.weight_factor || 'NULL'}`);
        }

        // Update any NULL weight factors to 1.00
        const [updateResult] = await connection.execute('UPDATE household_tasks SET weight_factor = 1.00 WHERE weight_factor IS NULL');
        
        if (updateResult.affectedRows > 0) {
            console.log(`\nUpdated ${updateResult.affectedRows} tasks with NULL weight_factor to 1.00`);
            
            // Show updated data
            const [updatedRows] = await connection.execute('SELECT id, name, hours, weight_factor FROM household_tasks ORDER BY id');
            console.log('\nAfter update:');
            console.log('ID | Name | Hours | Weight Factor');
            console.log('---|------|-------|-------------');
            
            for (const row of updatedRows) {
                console.log(`${row.id.toString().padEnd(2)} | ${row.name.padEnd(20)} | ${row.hours.toString().padEnd(5)} | ${row.weight_factor}`);
            }
        } else {
            console.log('\nAll weight factors are already set correctly.');
        }

        await connection.end();
    } catch (error) {
        console.error('Database operation failed:', error.message);
        process.exit(1);
    }
}

checkWeightFactors();