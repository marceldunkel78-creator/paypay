export declare class EmailService {
    private transporter;
    private isConfigured;
    constructor();
    sendApprovalRequest(to: string, subject: string, html: string): Promise<void | import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendApprovalConfirmation(to: string, subject?: string, html?: string): Promise<void | import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendRejectionNotification(to: string, subject?: string, html?: string): Promise<void | import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendNewUserRegistrationNotification(username: string, email: string): Promise<void | void[]>;
    sendUserApprovalConfirmation(userEmail: string, username: string): Promise<void | import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendUserRejectionNotification(userEmail: string, username: string): Promise<void | import("nodemailer/lib/smtp-transport").SentMessageInfo>;
}
//# sourceMappingURL=email.service.d.ts.map