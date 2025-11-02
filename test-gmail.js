// Gmail Test Script
const nodemailer = require('nodemailer');
require('dotenv').config();

// Test Gmail connection
async function testGmailConnection() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
        console.log('❌ EMAIL_USER oder EMAIL_PASS nicht in .env gesetzt');
        console.log('Bitte setzen Sie:');
        console.log('EMAIL_USER=ihre-email@gmail.com');
        console.log('EMAIL_PASS=ihr-app-passwort');
        return;
    }
    
    console.log(`🧪 Testing Gmail connection for: ${emailUser}`);
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    try {
        // Test connection
        await transporter.verify();
        console.log('✅ Gmail connection successful!');
        
        // Send test email
        const info = await transporter.sendMail({
            from: emailUser,
            to: emailUser, // An sich selbst senden
            subject: 'Test Email from Time Account App',
            text: 'This is a test email from your Time Account Management app!',
            html: '<h1>🎉 Test erfolgreich!</h1><p>Ihre Time Account Management App kann E-Mails senden!</p>'
        });
        
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        
    } catch (error) {
        console.error('❌ Gmail connection failed:');
        console.error(error.message);
        
        if (error.message.includes('Invalid login')) {
            console.log('\n💡 Possible solutions:');
            console.log('1. Check if you\'re using an App Password (not your regular password)');
            console.log('2. Enable 2-Factor Authentication');
            console.log('3. Generate a new App Password at: https://myaccount.google.com/apppasswords');
        }
    }
}

testGmailConnection();