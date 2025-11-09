const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config();

// Database configuration - use same logic as main application
function getDatabaseConfig() {
    const dbUrl = process.env.DATABASE_URL || '';
    
    if (dbUrl && dbUrl.startsWith('mysql://')) {
        // Handle URL format like mysql://user:pass@host:port/database
        try {
            const url = new URL(dbUrl);
            return {
                host: url.hostname,
                port: parseInt(url.port) || 3306,
                user: url.username,
                password: url.password || '',
                database: url.pathname.slice(1), // Remove leading slash
            };
        } catch (urlError) {
            console.warn('Failed to parse DATABASE_URL, falling back to manual parsing');
            // Manual parsing for URLs without password
            const match = dbUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
            if (match) {
                return {
                    host: match[2],
                    port: parseInt(match[3]) || 3306,
                    user: match[1],
                    password: '', // No password in URL
                    database: match[4],
                };
            } else {
                throw new Error('Invalid DATABASE_URL format');
            }
        }
    } else {
        // Fallback to individual environment variables
        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'time_account_db',
        };
    }
}

const dbConfig = getDatabaseConfig();

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function askPassword(question) {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        const stdout = process.stdout;
        
        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        
        let password = '';
        
        stdin.on('data', function(char) {
            char = char + '';
            
            switch(char) {
                case '\n':
                case '\r':
                case '\u0004':
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdout.write('\n');
                    resolve(password);
                    break;
                case '\u0003':
                    process.exit();
                    break;
                default:
                    password += char;
                    stdout.write('*');
                    break;
            }
        });
    });
}

async function createAdminUser() {
    try {
        console.log('🔧 Admin-Benutzer erstellen für Time Account Management\n');
        
        // Get username from user
        const username = await askQuestion('Benutzername für Admin (Standard: admin): ') || 'admin';
        
        // Get email from user  
        const email = await askQuestion('E-Mail-Adresse für Admin: ');
        
        if (!email || !email.includes('@')) {
            console.error('❌ Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            rl.close();
            process.exit(1);
        }
        
        // Get password from user
        const password = await askPassword('Passwort für Admin (wird nicht angezeigt): ');
        
        if (!password || password.length < 6) {
            console.error('\n❌ Passwort muss mindestens 6 Zeichen lang sein.');
            rl.close();
            process.exit(1);
        }
        
        rl.close();
        
        console.log('\n🔗 Verbinde zur Datenbank...');
        const db = await mysql.createConnection(dbConfig);
        
        console.log('🔐 Hashe das Passwort...');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('👨‍💼 Erstelle Admin-User...');
        const query = `
            INSERT INTO users (username, email, password, role, status) 
            VALUES (?, ?, ?, 'admin', 'active')
            ON DUPLICATE KEY UPDATE 
                email = VALUES(email),
                password = VALUES(password),
                role = VALUES(role),
                status = VALUES(status)
        `;
        
        await db.execute(query, [username, email, hashedPassword]);
        
        console.log('\n✅ Admin-User erfolgreich erstellt!');
        console.log(`👤 Username: ${username}`);
        console.log(`📧 E-Mail: ${email}`);
        console.log(`🔑 Passwort: [verborgen]`);
        console.log('\n🚀 Sie können sich jetzt mit diesen Daten anmelden.');
        console.log('🌐 App-URL: http://localhost:3000');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fehler beim Erstellen des Admin-Users:', error.message);
        rl.close();
        process.exit(1);
    }
}

createAdminUser();