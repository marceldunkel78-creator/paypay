"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.post('/change-password', auth_middleware_1.authMiddleware, (req, res) => authController.changePassword(req, res));
router.get('/users', auth_middleware_1.authMiddleware, (req, res) => authController.getAllUsers(req, res));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map