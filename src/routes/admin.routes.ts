import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { passwordProtectMiddleware } from '../middlewares/password-protect.middleware';

const router = Router();
const adminController = new AdminController();

// Time Account Management Routes
router.post('/approve/:requestId', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.approveRequest(req, res));
router.post('/reject/:requestId', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.rejectRequest(req, res));
router.get('/requests', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.getPendingRequests(req, res));

// User Management Routes
router.get('/users', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.getAllUsers(req, res));
router.get('/users/pending', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.getPendingUsers(req, res));
router.post('/users/:userId/approve', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.approveUser(req, res));
router.post('/users/:userId/activate', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.activateUser(req, res));
router.post('/users/:userId/suspend', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.suspendUser(req, res));
router.delete('/users/:userId', authMiddleware, passwordProtectMiddleware, (req, res) => adminController.deleteUser(req, res));

export default router;