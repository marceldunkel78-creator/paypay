import nodemailer from 'nodemailer';
import { config } from '../config/default';

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure, // true for 465, false for other ports
            auth: {
                user: config.email.user,
                pass: config.email.pass,
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

    async sendApprovalConfirmation(to: string, subject: string, html: string) {
        const mailOptions = {
            from: config.email.from,
            to,
            subject,
            html,
        };

        return this.transporter.sendMail(mailOptions);
    }
}