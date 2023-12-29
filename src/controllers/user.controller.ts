import { Request, Response, NextFunction } from "express";
import { UserService } from "../services";
import createHttpError from "http-errors";

class UserController {
    constructor(private userService: UserService) {}

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        try {
            const user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
            return res.json({ user });
        } catch (error) {
            return next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.userService.getAll();
            return res.json({ users });
        } catch (error) {
            return next(error);
        }
    }
}

export default UserController;
