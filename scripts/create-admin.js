import { connectToDatabase } from '../src/db/index.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
    try {
        console.log('Verbinde zur Datenbank...');
        const db = await connectToDatabase();
        
        const username = 'admin';
        const password = 'admin123'; // Sie können dies ändern
        
        console.log('Hashe das Passwort...');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Erstelle Admin-User...');
        const query = `
            INSERT INTO users (username, password, role) 
            VALUES (?, ?, 'admin')
            ON DUPLICATE KEY UPDATE 
                password = VALUES(password),
                role = VALUES(role)
        `;
        
        await db.execute(query, [username, hashedPassword]);
        
        console.log(`Admin-User erstellt:`);
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('Sie können sich jetzt mit diesen Daten anmelden.');
        
        process.exit(0);
    } catch (error) {
        console.error('Fehler beim Erstellen des Admin-Users:', error);
        process.exit(1);
    }
}

createAdminUser();