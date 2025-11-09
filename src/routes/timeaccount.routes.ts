import { Router } from 'express';
import { TimeAccountController } from '../controllers/timeaccount.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const timeAccountController = new TimeAccountController();

// Route to create a new time account
router.post('/time-accounts', authMiddleware, (req, res) => timeAccountController.createTimeAccount(req, res));

// Route to get all time accounts
router.get('/time-accounts', authMiddleware, (req, res) => timeAccountController.getAllTimeAccounts(req, res));

// Route to update a time account
router.put('/time-accounts/:id', authMiddleware, (req, res) => {
    res.status(501).json({ message: 'Update not implemented yet' });
});

// Route to delete a time account
router.delete('/time-accounts/:id', authMiddleware, (req, res) => timeAccountController.deleteTimeAccount(req, res));

// Zeit-Transfer Routen
router.post('/transfer-hours', authMiddleware, (req, res) => timeAccountController.transferHours(req, res));
router.get('/balance', authMiddleware, (req, res) => timeAccountController.getUserBalance(req, res));
router.get('/transfer-history', authMiddleware, (req, res) => timeAccountController.getTransferHistory(req, res));
router.delete('/reset-transfer-history', authMiddleware, (req, res) => timeAccountController.resetTransferHistory(req, res));



export default router;