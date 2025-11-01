"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordProtectMiddleware = exports.passwordProtect = void 0;
function passwordProtect(req, res, next) {
    const password = req.headers['x-password'];
    if (password === process.env.APP_PASSWORD) {
        next();
    }
    else {
        res.status(403).send('Forbidden: Incorrect password');
    }
}
exports.passwordProtect = passwordProtect;
exports.passwordProtectMiddleware = passwordProtect;
