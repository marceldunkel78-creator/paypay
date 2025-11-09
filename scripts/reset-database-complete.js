const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
    let connection;
    try {
        // Erste Verbindung ohne Datenbank um sie zu löschen/erstellen
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('Verbunden mit MySQL Server');

        // SQL-Datei lesen
        const sqlFile = path.join(__dirname, 'reset-complete-database.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Führe Datenbank-Reset aus...');
        
        // SQL ausführen
        await connection.execute(sql);

        console.log('✅ Datenbank erfolgreich neu erstellt!');
        
        // Prüfen was erstellt wurde
        await connection.execute('USE time_account_db');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Erstellte Tabellen:');
        console.table(tables);

        const [tasks] = await connection.execute('SELECT id, name, weight_factor FROM household_tasks');
        console.log('Hausarbeiten:');
        console.table(tasks);

        const [users] = await connection.execute('SELECT id, username, role, status FROM users');
        console.log('Benutzer:');
        console.table(users);

    } catch (error) {
        console.error('❌ Fehler beim Datenbank-Reset:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Datenbankverbindung geschlossen');
        }
    }
}

resetDatabase();