"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const default_1 = __importDefault(require("../config/default"));
class EmailService {
    constructor() {
        this.isConfigured = !!(default_1.default.email.user && default_1.default.email.password);
        if (this.isConfigured) {
            this.transporter = nodemailer_1.default.createTransport({
                service: default_1.default.email.service,
                auth: {
                    user: default_1.default.email.user,
                    pass: default_1.default.email.password,
                },
            });
        }
        else {
            console.warn('Email service not configured - email notifications will be skipped');
        }
    }
    async sendApprovalRequest(to, subject, html) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send approval request');
            return Promise.resolve();
        }
        const mailOptions = {
            from: default_1.default.email.from,
            to,
            subject,
            html,
        };
        return this.transporter.sendMail(mailOptions);
    }
    async sendApprovalConfirmation(to, subject = 'Request Approved', html = 'Your time account request has been approved.') {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send approval confirmation');
            return Promise.resolve();
        }
        const mailOptions = {
            from: default_1.default.email.from,
            to,
            subject,
            html,
        };
        return this.transporter.sendMail(mailOptions);
    }
    async sendRejectionNotification(to, subject = 'Request Rejected', html = 'Your time account request has been rejected.') {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send rejection notification');
            return Promise.resolve();
        }
        const mailOptions = {
            from: default_1.default.email.from,
            to,
            subject,
            html,
        };
        return this.transporter.sendMail(mailOptions);
    }
    // User Registration and Approval Email Methods
    async sendNewUserRegistrationNotification(username, email) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send new user registration notification');
            return Promise.resolve();
        }
        // Get admin emails from environment variables
        const adminEmails = [
            process.env.ADMIN_EMAIL_1,
            process.env.ADMIN_EMAIL_2
        ].filter(email => email && email.includes('@'));
        if (adminEmails.length === 0) {
            console.log('No valid admin emails configured for new user notification');
            return Promise.resolve();
        }
        const subject = `Neue Benutzerregistrierung - ${username}`;
        const html = `
            <h2>👤 Neue Benutzerregistrierung</h2>
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p><strong>Benutzername:</strong> ${username}</p>
                <p><strong>E-Mail:</strong> ${email}</p>
                <p><strong>Status:</strong> ⏳ Wartet auf Admin-Genehmigung</p>
                <p><strong>Registriert am:</strong> ${new Date().toLocaleString('de-DE')}</p>
            </div>
            <p>Bitte loggen Sie sich in die Time Account Management App ein, um diese Registrierung zu genehmigen oder abzulehnen.</p>
            <p><em>Diese E-Mail wurde automatisch generiert.</em></p>
        `;
        // Send to all admin emails
        const promises = adminEmails.map(adminEmail => {
            if (adminEmail && this.transporter) {
                const mailOptions = {
                    from: default_1.default.email.from,
                    to: adminEmail,
                    subject,
                    html,
                };
                return this.transporter.sendMail(mailOptions)
                    .then(() => console.log(`New user registration notification sent to ${adminEmail}`))
                    .catch(error => console.warn(`Failed to send registration notification to ${adminEmail}:`, error));
            }
            return Promise.resolve();
        });
        return Promise.all(promises);
    }
    async sendUserApprovalConfirmation(userEmail, username) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send user approval confirmation');
            return Promise.resolve();
        }
        const subject = `Account genehmigt - Willkommen im Time Account Management System!`;
        const html = `
            <h2>🎉 Ihr Account wurde genehmigt!</h2>
            <div style="border: 1px solid #28a745; padding: 15px; border-radius: 5px; margin: 10px 0; background-color: #f8fff9;">
                <p>Hallo <strong>${username}</strong>,</p>
                <p>Ihr Account im Time Account Management System wurde erfolgreich genehmigt!</p>
                <p><strong>✅ Sie können sich jetzt anmelden und das System nutzen.</strong></p>
            </div>
            <div style="margin: 20px 0;">
                <h3>Was Sie jetzt tun können:</h3>
                <ul>
                    <li>🕒 Zeiterfassungen für produktive Arbeiten erstellen</li>
                    <li>📱 Bildschirmzeit verwalten</li>
                    <li>📊 Ihren Zeitkontostand einsehen</li>
                    <li>🏠 Hausarbeiten auswählen und Zeit gutschreiben lassen</li>
                </ul>
            </div>
            <p>Loggen Sie sich unter <a href="http://localhost:3000">Time Account Management</a> ein.</p>
            <p>Viel Erfolg mit Ihrem Time Management!</p>
            <p><em>Diese E-Mail wurde automatisch generiert.</em></p>
        `;
        const mailOptions = {
            from: default_1.default.email.from,
            to: userEmail,
            subject,
            html,
        };
        return this.transporter.sendMail(mailOptions);
    }
    async sendUserRejectionNotification(userEmail, username) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send user rejection notification');
            return Promise.resolve();
        }
        const subject = `Registrierung abgelehnt - Time Account Management System`;
        const html = `
            <h2>❌ Ihre Registrierung wurde abgelehnt</h2>
            <div style="border: 1px solid #dc3545; padding: 15px; border-radius: 5px; margin: 10px 0; background-color: #fff5f5;">
                <p>Hallo <strong>${username}</strong>,</p>
                <p>Ihre Registrierung im Time Account Management System wurde leider abgelehnt.</p>
                <p>Falls Sie Fragen dazu haben, wenden Sie sich bitte an die Administratoren.</p>
            </div>
            <p><em>Diese E-Mail wurde automatisch generiert.</em></p>
        `;
        const mailOptions = {
            from: default_1.default.email.from,
            to: userEmail,
            subject,
            html,
        };
        return this.transporter.sendMail(mailOptions);
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=email.service.js.map