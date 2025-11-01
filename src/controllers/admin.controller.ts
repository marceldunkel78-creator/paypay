import { Request, Response } from 'express';
import { TimeAccountService } from '../services/timeaccount.service';
import { EmailService } from '../services/email.service';

export class AdminController {
    private timeAccountService: TimeAccountService;
    private emailService: EmailService;

    constructor() {
        this.timeAccountService = new TimeAccountService();
        this.emailService = new EmailService();
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
            await this.emailService.sendApprovalConfirmation(request.userEmail);

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
            await this.emailService.sendRejectionNotification(request.userEmail);

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
}