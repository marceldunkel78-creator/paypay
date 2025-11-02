import nodemailer from 'nodemailer';
import config from '../config/default';

export class EmailService {
    private transporter;
    private isConfigured: boolean;

    constructor() {
        this.isConfigured = !!(config.email.user && config.email.password);
        
        if (this.isConfigured) {
            this.transporter = nodemailer.createTransport({
                service: config.email.service,
                auth: {
                    user: config.email.user,
                    pass: config.email.password,
                },
            });
        } else {
            console.warn('Email service not configured - email notifications will be skipped');
        }
    }

    async sendApprovalRequest(to: string, subject: string, html: string) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send approval request');
            return Promise.resolve();
        }

        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendApprovalConfirmation(to: string, subject: string = 'Request Approved', html: string = 'Your time account request has been approved.') {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send approval confirmation');
            return Promise.resolve();
        }

        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendRejectionNotification(to: string, subject: string = 'Request Rejected', html: string = 'Your time account request has been rejected.') {
        if (!this.isConfigured || !this.transporter) {
            console.warn('Email service not configured - cannot send rejection notification');
            return Promise.resolve();
        }

        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }
}