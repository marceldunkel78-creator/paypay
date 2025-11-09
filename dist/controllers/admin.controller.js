"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const timeaccount_service_1 = require("../services/timeaccount.service");
const email_service_1 = require("../services/email.service");
const auth_service_1 = require("../services/auth.service");
const household_task_service_1 = require("../services/household-task.service");
class AdminController {
    constructor() {
        this.timeAccountService = new timeaccount_service_1.TimeAccountService();
        this.emailService = new email_service_1.EmailService();
        this.authService = new auth_service_1.AuthService();
        this.householdTaskService = new household_task_service_1.HouseholdTaskService();
    }
    async approveRequest(req, res) {
        const { requestId } = req.params;
        try {
            const request = await this.timeAccountService.getRequestById(parseInt(requestId));
            if (!request) {
                res.status(404).send('Request not found');
                return;
            }
            await this.timeAccountService.approveRequest(parseInt(requestId));
            // Send email notification if email is configured
            try {
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    await this.emailService.sendApprovalConfirmation(request.userEmail);
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
    }
    async rejectRequest(req, res) {
        const { requestId } = req.params;
        try {
            const request = await this.timeAccountService.getRequestById(parseInt(requestId));
            if (!request) {
                res.status(404).send('Request not found');
                return;
            }
            await this.timeAccountService.rejectRequest(parseInt(requestId));
            // Send email notification if email is configured
            try {
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    await this.emailService.sendRejectionNotification(request.userEmail);
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
    }
    async getPendingRequests(req, res) {
        try {
            const requests = await this.timeAccountService.getTimeAccounts();
            const pendingRequests = requests.filter(req => req.status === 'pending');
            res.status(200).json(pendingRequests);
        }
        catch (error) {
            res.status(500).json({ message: 'Error retrieving pending requests', error });
        }
    }
    // User Management Methods
    async getAllUsers(req, res) {
        try {
            const users = await this.authService.getAllUsers();
            res.status(200).json(users);
        }
        catch (error) {
            console.error('Error fetching all users:', error);
            res.status(500).json({ message: 'Error retrieving users', error });
        }
    }
    async getPendingUsers(req, res) {
        try {
            const pendingUsers = await this.authService.getPendingUsers();
            res.status(200).json(pendingUsers);
        }
        catch (error) {
            console.error('Error fetching pending users:', error);
            res.status(500).json({ message: 'Error retrieving pending users', error });
        }
    }
    async approveUser(req, res) {
        const { userId } = req.params;
        try {
            const success = await this.authService.approveUser(parseInt(userId));
            if (success) {
                res.status(200).json({ message: 'User approved successfully' });
            }
            else {
                res.status(404).json({ message: 'User not found or not pending' });
            }
        }
        catch (error) {
            console.error('Error approving user:', error);
            res.status(500).json({ message: 'Error approving user', error });
        }
    }
    async suspendUser(req, res) {
        const { userId } = req.params;
        try {
            const success = await this.authService.suspendUser(parseInt(userId));
            if (success) {
                res.status(200).json({ message: 'User suspended successfully' });
            }
            else {
                res.status(404).json({ message: 'User not found' });
            }
        }
        catch (error) {
            console.error('Error suspending user:', error);
            res.status(500).json({ message: 'Error suspending user', error });
        }
    }
    async activateUser(req, res) {
        const { userId } = req.params;
        try {
            const success = await this.authService.activateUser(parseInt(userId));
            if (success) {
                res.status(200).json({ message: 'User activated successfully' });
            }
            else {
                res.status(404).json({ message: 'User not found or not suspended' });
            }
        }
        catch (error) {
            console.error('Error activating user:', error);
            res.status(500).json({ message: 'Error activating user', error });
        }
    }
    async deleteUser(req, res) {
        const { userId } = req.params;
        try {
            const success = await this.authService.deleteUser(parseInt(userId));
            if (success) {
                res.status(200).json({ message: 'User and all associated data deleted successfully' });
            }
            else {
                res.status(404).json({ message: 'User not found' });
            }
        }
        catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Error deleting user', error });
        }
    }
    // Weight Factor Management
    async getHouseholdTasks(req, res) {
        try {
            const tasks = await this.householdTaskService.getAllHouseholdTasks();
            res.status(200).json(tasks);
        }
        catch (error) {
            console.error('Error fetching household tasks:', error);
            res.status(500).json({ message: 'Error fetching household tasks', error });
        }
    }
    async updateWeightFactor(req, res) {
        try {
            const { taskId } = req.params;
            const { weight_factor } = req.body;
            if (!taskId || !weight_factor) {
                res.status(400).json({ error: 'Task ID und Weight Factor sind erforderlich' });
                return;
            }
            const weightFactorNum = parseFloat(weight_factor);
            if (isNaN(weightFactorNum) || weightFactorNum <= 0 || weightFactorNum > 5) {
                res.status(400).json({ error: 'Weight Factor muss zwischen 0.01 und 5.00 liegen' });
                return;
            }
            const success = await this.householdTaskService.updateWeightFactor(parseInt(taskId), weightFactorNum);
            if (success) {
                res.status(200).json({ message: 'Weight Factor erfolgreich aktualisiert' });
            }
            else {
                res.status(404).json({ error: 'Hausarbeit nicht gefunden' });
            }
        }
        catch (error) {
            console.error('Error updating weight factor:', error);
            res.status(500).json({ message: 'Error updating weight factor', error });
        }
    }
    // User Balance Management
    async adjustUserBalance(req, res) {
        try {
            const { userId } = req.params;
            const { balance } = req.body;
            if (!userId || balance === undefined) {
                res.status(400).json({ error: 'User ID und Balance sind erforderlich' });
                return;
            }
            const balanceNum = parseFloat(balance);
            if (isNaN(balanceNum)) {
                res.status(400).json({ error: 'Balance muss eine gültige Zahl sein' });
                return;
            }
            const success = await this.timeAccountService.adjustUserBalance(parseInt(userId), balanceNum);
            if (success) {
                res.status(200).json({ message: 'Zeitkonto erfolgreich angepasst' });
            }
            else {
                res.status(404).json({ error: 'Benutzer nicht gefunden' });
            }
        }
        catch (error) {
            console.error('Error adjusting user balance:', error);
            res.status(500).json({ message: 'Error adjusting user balance', error });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map