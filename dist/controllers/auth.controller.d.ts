import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    constructor();
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;
    getAllUsers(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map