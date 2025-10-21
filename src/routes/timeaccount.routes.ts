import { Router } from 'express';
import { TimeAccountController } from '../controllers/timeaccount.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const timeAccountController = new TimeAccountController();

// Route to create a new time account
router.post('/time-accounts', authMiddleware, timeAccountController.createTimeAccount);

// Route to get all time accounts
router.get('/time-accounts', authMiddleware, timeAccountController.getAllTimeAccounts);

// Route to update a time account
router.put('/time-accounts/:id', authMiddleware, timeAccountController.updateTimeAccount);

// Route to delete a time account
router.delete('/time-accounts/:id', authMiddleware, timeAccountController.deleteTimeAccount);

export default router;