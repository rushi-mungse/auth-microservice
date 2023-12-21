import { Request, Response, NextFunction } from "express";

class AuthController {
    constructor() {}
    sendOtp(req: Request, res: Response, next: NextFunction) {
        res.json({ ok: true });
    }
}

export default AuthController;
