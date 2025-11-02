"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
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
router.post('/users/:userId/suspend', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.suspendUser(req, res));
router.delete('/users/:userId', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.deleteUser(req, res));
exports.default = router;
