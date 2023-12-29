import { Request, Response, NextFunction } from "express";
import { UserService } from "../services";
import createHttpError from "http-errors";
import { IAuthRequest, IUpdateFullNameRequest } from "../types";
import { validationResult } from "express-validator";

class UserController {
    constructor(private userService: UserService) {}

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        if (isNaN(Number(userId))) {
            return next(createHttpError(400, "Invalid param id!"));
        }

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

    async delete(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        if (isNaN(Number(userId)))
            return next(createHttpError(400, "Invalid param id!"));

        try {
            const user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
            await this.userService.deleteUserById(Number(userId));
            return res.json({ id: userId });
        } catch (error) {
            return next(error);
        }
    }

    async deleteMySelf(req: IAuthRequest, res: Response, next: NextFunction) {
        const userId = req.auth.userId;
        try {
            const user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));

            await this.userService.deleteUserById(Number(userId));

            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            return res.json({
                user: null,
                message: "User deleted successfully",
            });
        } catch (error) {
            return next(error);
        }
    }

    async updateFullName(
        req: IUpdateFullNameRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { fullName } = req.body;
        try {
            const user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));

            user.fullName = fullName;
            await this.userService.saveUser(user);

            return res.json({
                message: "Update user fullName successfully.",
                user,
            });
        } catch (error) {
            return next(error);
        }
    }
}

export default UserController;
