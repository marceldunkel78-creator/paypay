"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    sendApprovalRequest(to, subject, html) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    sendApprovalConfirmation(to, subject = 'Request Approved', html = 'Your time account request has been approved.') {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    sendRejectionNotification(to, subject = 'Request Rejected', html = 'Your time account request has been rejected.') {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.EmailService = EmailService;
