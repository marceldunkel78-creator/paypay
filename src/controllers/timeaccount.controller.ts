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

    // Zeit an anderen User verschenken
    public async transferHours(req: Request, res: Response): Promise<void> {
        try {
            const { toUserId, hours, reason } = req.body;
            const fromUserId = (req as any).user?.id; // aus auth middleware
            
            console.log('Transfer request:', { fromUserId, toUserId, hours, reason });
            
            if (!fromUserId) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            
            if (!toUserId || !hours) {
                res.status(400).json({ message: 'Recipient user ID and hours are required' });
                return;
            }

            const success = await this.timeAccountService.transferHoursToUser(
                parseInt(fromUserId), 
                parseInt(toUserId), 
                parseFloat(hours),
                reason
            );

            if (success) {
                res.status(200).json({ 
                    message: 'Hours transferred successfully',
                    transfer: {
                        fromUserId: parseInt(fromUserId),
                        toUserId: parseInt(toUserId),
                        hours: parseFloat(hours),
                        reason: reason || 'Zeitübertragung'
                    }
                });
            } else {
                res.status(400).json({ message: 'Failed to transfer hours' });
            }
        } catch (error) {
            console.error('Transfer error:', error);
            res.status(400).json({ 
                message: error instanceof Error ? error.message : 'Error transferring hours'
            });
        }
    }

    // Aktuelle Balance abrufen
    public async getUserBalance(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id; // aus auth middleware
            console.log('Getting balance for user ID:', userId);
            
            if (!userId) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            
            const balance = await this.timeAccountService.getUserBalance(parseInt(userId));
            console.log('Retrieved balance:', balance);
            res.status(200).json({ balance });
        } catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({ message: 'Error retrieving balance' });
        }
    }

    // Transfer-Historie abrufen
    public async getTransferHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id; // aus auth middleware
            const transfers = await this.timeAccountService.getTransferHistory(parseInt(userId));
            res.status(200).json(transfers);
        } catch (error) {
            console.error('Get transfer history error:', error);
            res.status(500).json({ message: 'Error retrieving transfer history' });
        }
    }

    // Transfer-Historie zurücksetzen
    public async resetTransferHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id; // aus auth middleware
            await this.timeAccountService.resetTransferHistory(parseInt(userId));
            res.status(200).json({ message: 'Transfer-Historie erfolgreich zurückgesetzt' });
        } catch (error) {
            console.error('Reset transfer history error:', error);
            res.status(500).json({ message: 'Error resetting transfer history' });
        }
    }
}