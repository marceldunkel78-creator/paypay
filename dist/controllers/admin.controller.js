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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const timeaccount_service_1 = require("../services/timeaccount.service");
const email_service_1 = require("../services/email.service");
class AdminController {
    constructor() {
        this.timeAccountService = new timeaccount_service_1.TimeAccountService();
        this.emailService = new email_service_1.EmailService();
    }
    approveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { requestId } = req.params;
            try {
                const request = yield this.timeAccountService.getRequestById(parseInt(requestId));
                if (!request) {
                    res.status(404).send('Request not found');
                    return;
                }
                yield this.timeAccountService.approveRequest(parseInt(requestId));
                // Send email notification if email is configured
                try {
                    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                        yield this.emailService.sendApprovalConfirmation(request.userEmail);
                        console.log(`Approval notification sent to ${request.userEmail}`);
                    }
                    else {
                        console.log('Email not configured - skipping notification');
                    }
                }
                catch (emailError) {
                    console.warn('Failed to send email notification:', emailError);
                    // Continue without failing the request
                }
                res.status(200).send('Request approved and user notified');
            }
            catch (error) {
                res.status(500).send('Error approving request');
            }
        });
    }
    rejectRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { requestId } = req.params;
            try {
                const request = yield this.timeAccountService.getRequestById(parseInt(requestId));
                if (!request) {
                    res.status(404).send('Request not found');
                    return;
                }
                yield this.timeAccountService.rejectRequest(parseInt(requestId));
                // Send email notification if email is configured
                try {
                    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                        yield this.emailService.sendRejectionNotification(request.userEmail);
                        console.log(`Rejection notification sent to ${request.userEmail}`);
                    }
                    else {
                        console.log('Email not configured - skipping notification');
                    }
                }
                catch (emailError) {
                    console.warn('Failed to send email notification:', emailError);
                    // Continue without failing the request
                }
                res.status(200).send('Request rejected and user notified');
            }
            catch (error) {
                res.status(500).send('Error rejecting request');
            }
        });
    }
    getPendingRequests(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requests = yield this.timeAccountService.getTimeAccounts();
                const pendingRequests = requests.filter(req => req.status === 'pending');
                res.status(200).json(pendingRequests);
            }
            catch (error) {
                res.status(500).json({ message: 'Error retrieving pending requests', error });
            }
        });
    }
}
exports.AdminController = AdminController;
