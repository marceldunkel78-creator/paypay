import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { passwordProtectMiddleware } from '../middlewares/password-protect.middleware';

const router = Router();
const adminController = new AdminController();

// Route to approve a time account request
router.post('/approve/:requestId', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.approveRequest(req, res));

// Route to reject a time account request
router.post('/reject/:requestId', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.rejectRequest(req, res));

// Route to get all pending requests
router.get('/requests', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.getPendingRequests(req, res));

export default router;