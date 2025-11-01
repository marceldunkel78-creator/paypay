import nodemailer from 'nodemailer';
import config from '../config/default';

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: config.email.service,
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });
    }

    async sendApprovalRequest(to: string, subject: string, html: string) {
        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendApprovalConfirmation(to: string, subject: string = 'Request Approved', html: string = 'Your time account request has been approved.') {
        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendRejectionNotification(to: string, subject: string = 'Request Rejected', html: string = 'Your time account request has been rejected.') {
        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }
}