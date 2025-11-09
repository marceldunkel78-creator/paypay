import { Request, Response } from 'express';
import { TimeAccountService } from '../services/timeaccount.service';
import { EmailService } from '../services/email.service';
import { AuthService } from '../services/auth.service';
import { HouseholdTaskService } from '../services/household-task.service';

export class AdminController {
    private timeAccountService: TimeAccountService;
    private emailService: EmailService;
    private authService: AuthService;
    private householdTaskService: HouseholdTaskService;

    constructor() {
        this.timeAccountService = new TimeAccountService();
        this.emailService = new EmailService();
        this.authService = new AuthService();
        this.householdTaskService = new HouseholdTaskService();
    }

    public async approveRequest(req: Request, res: Response): Promise<void> {
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
                } else {
                    console.log('Email not configured - skipping notification');
                }
            } catch (emailError) {
                console.warn('Failed to send email notification:', emailError);
                // Continue without failing the request
            }

            res.status(200).send('Request approved and user notified');
        } catch (error) {
            res.status(500).send('Error approving request');
        }
    }

    public async rejectRequest(req: Request, res: Response): Promise<void> {
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
                } else {
                    console.log('Email not configured - skipping notification');
                }
            } catch (emailError) {
                console.warn('Failed to send email notification:', emailError);
                // Continue without failing the request
            }

            res.status(200).send('Request rejected and user notified');
        } catch (error) {
            res.status(500).send('Error rejecting request');
        }
    }

    public async getPendingRequests(req: Request, res: Response): Promise<void> {
        try {
            const requests = await this.timeAccountService.getTimeAccounts();
            const pendingRequests = requests.filter(req => req.status === 'pending');
            res.status(200).json(pendingRequests);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving pending requests', error });
        }
    }

    // User Management Methods

    public async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.authService.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching all users:', error);
            res.status(500).json({ message: 'Error retrieving users', error });
        }
    }

    public async getPendingUsers(req: Request, res: Response): Promise<void> {
        try {
            const pendingUsers = await this.authService.getPendingUsers();
            res.status(200).json(pendingUsers);
        } catch (error) {
            console.error('Error fetching pending users:', error);
            res.status(500).json({ message: 'Error retrieving pending users', error });
        }
    }

    public async approveUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const success = await this.authService.approveUser(parseInt(userId));
            
            if (success) {
                res.status(200).json({ message: 'User approved successfully' });
            } else {
                res.status(404).json({ message: 'User not found or not pending' });
            }
        } catch (error) {
            console.error('Error approving user:', error);
            res.status(500).json({ message: 'Error approving user', error });
        }
    }

    public async suspendUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const success = await this.authService.suspendUser(parseInt(userId));
            
            if (success) {
                res.status(200).json({ message: 'User suspended successfully' });
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            console.error('Error suspending user:', error);
            res.status(500).json({ message: 'Error suspending user', error });
        }
    }

    public async activateUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const success = await this.authService.activateUser(parseInt(userId));
            
            if (success) {
                res.status(200).json({ message: 'User activated successfully' });
            } else {
                res.status(404).json({ message: 'User not found or not suspended' });
            }
        } catch (error) {
            console.error('Error activating user:', error);
            res.status(500).json({ message: 'Error activating user', error });
        }
    }

    public async deleteUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        try {
            const success = await this.authService.deleteUser(parseInt(userId));
            
            if (success) {
                res.status(200).json({ message: 'User and all associated data deleted successfully' });
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Error deleting user', error });
        }
    }

    // Weight Factor Management
    public async getHouseholdTasks(req: Request, res: Response): Promise<void> {
        try {
            const tasks = await this.householdTaskService.getAllHouseholdTasks();
            res.status(200).json(tasks);
        } catch (error) {
            console.error('Error fetching household tasks:', error);
            res.status(500).json({ message: 'Error fetching household tasks', error });
        }
    }

    public async updateWeightFactor(req: Request, res: Response): Promise<void> {
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
            } else {
                res.status(404).json({ error: 'Hausarbeit nicht gefunden' });
            }
        } catch (error) {
            console.error('Error updating weight factor:', error);
            res.status(500).json({ message: 'Error updating weight factor', error });
        }
    }

    // User Balance Management
    public async adjustUserBalance(req: Request, res: Response): Promise<void> {
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
            } else {
                res.status(404).json({ error: 'Benutzer nicht gefunden' });
            }
        } catch (error) {
            console.error('Error adjusting user balance:', error);
            res.status(500).json({ message: 'Error adjusting user balance', error });
        }
    }
}