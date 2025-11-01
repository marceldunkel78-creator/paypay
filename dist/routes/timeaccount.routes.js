"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timeaccount_controller_1 = require("../controllers/timeaccount.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const timeAccountController = new timeaccount_controller_1.TimeAccountController();
// Route to create a new time account
router.post('/time-accounts', auth_middleware_1.authMiddleware, (req, res) => timeAccountController.createTimeAccount(req, res));
// Route to get all time accounts
router.get('/time-accounts', auth_middleware_1.authMiddleware, (req, res) => timeAccountController.getAllTimeAccounts(req, res));
// Route to update a time account
router.put('/time-accounts/:id', auth_middleware_1.authMiddleware, (req, res) => {
    res.status(501).json({ message: 'Update not implemented yet' });
});
// Route to delete a time account
router.delete('/time-accounts/:id', auth_middleware_1.authMiddleware, (req, res) => timeAccountController.deleteTimeAccount(req, res));
exports.default = router;
