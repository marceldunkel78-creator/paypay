import { Request, Response, NextFunction } from 'express';

export function passwordProtect(req: Request, res: Response, next: NextFunction) {
    const password = req.headers['x-password'];

    if (password === process.env.APP_PASSWORD) {
        next();
    } else {
        res.status(403).send('Forbidden: Incorrect password');
    }
}

export const passwordProtectMiddleware = passwordProtect;