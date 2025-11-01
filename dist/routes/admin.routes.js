"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const password_protect_middleware_1 = require("../middlewares/password-protect.middleware");
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
// Route to approve a time account request
router.post('/approve/:requestId', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.approveRequest(req, res));
// Route to reject a time account request
router.post('/reject/:requestId', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.rejectRequest(req, res));
// Route to get all pending requests
router.get('/requests', auth_middleware_1.authMiddleware, password_protect_middleware_1.passwordProtectMiddleware, (req, res) => adminController.getPendingRequests(req, res));
exports.default = router;
