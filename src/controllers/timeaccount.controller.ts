import { Request, Response } from 'express';
import { TimeAccountService } from '../services/timeaccount.service';

export class TimeAccountController {
    private timeAccountService: TimeAccountService;

    constructor() {
        this.timeAccountService = new TimeAccountService();
    }

    public async createTimeAccount(req: Request, res: Response): Promise<void> {
        try {
            const { userId, hours } = req.body;
            const newTimeAccount = await this.timeAccountService.createTimeAccount(parseInt(userId), parseFloat(hours));
            res.status(201).json(newTimeAccount);
        } catch (error) {
            res.status(500).json({ message: 'Error creating time account', error });
        }
    }

    public async getTimeAccounts(req: Request, res: Response): Promise<void> {
        try {
            const timeAccounts = await this.timeAccountService.getTimeAccounts();
            res.status(200).json(timeAccounts);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving time accounts', error });
        }
    }

    public async getTimeAccountById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const timeAccount = await this.timeAccountService.getTimeAccountById(parseInt(id));
            if (timeAccount) {
                res.status(200).json(timeAccount);
            } else {
                res.status(404).json({ message: 'Time account not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving time account', error });
        }
    }

    public async deleteTimeAccount(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await this.timeAccountService.deleteTimeAccount(parseInt(id));
            if (deleted) {
                res.status(200).json({ message: 'Time account deleted successfully' });
            } else {
                res.status(404).json({ message: 'Time account not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting time account', error });
        }
    }

    public async getAllTimeAccounts(req: Request, res: Response): Promise<void> {
        try {
            const timeAccounts = await this.timeAccountService.getTimeAccounts();
            res.status(200).json(timeAccounts);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving time accounts', error });
        }
    }
}