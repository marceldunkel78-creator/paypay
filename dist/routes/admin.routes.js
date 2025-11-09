"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const cleanup_controller_1 = require("../controllers/cleanup.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const password_protect_middleware_1 = require("../middlewares/password-protect.middleware");
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
// Time Account Management Routes
router.post('/approve/:requestId', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.approveRequest(req, res));
router.post('/reject/:requestId', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.rejectRequest(req, res));
router.get('/requests', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.getPendingRequests(req, res));
// User Management Routes
router.get('/users', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.getAllUsers(req, res));
router.get('/users/pending', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.getPendingUsers(req, res));
router.post('/users/:userId/approve', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.approveUser(req, res));
router.post('/users/:userId/activate', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.activateUser(req, res));
router.post('/users/:userId/suspend', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.suspendUser(req, res));
router.delete('/users/:userId', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.deleteUser(req, res));
// Weight Factor Management Routes
router.get('/household-tasks', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.getHouseholdTasks(req, res));
router.put('/household-tasks/:taskId/weight-factor', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.updateWeightFactor(req, res));
// User Balance Management Routes
router.put('/users/:userId/balance', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.adjustUserBalance(req, res));
// Database Cleanup Routes
router.get('/clean-duplicates', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, cleanup_controller_1.cleanHouseholdTaskDuplicates);
exports.default = router;
