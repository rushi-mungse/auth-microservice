import { Request, Response, NextFunction } from "express";
import { CredentialService, UserService } from "../services";
import createHttpError from "http-errors";
import {
    IAuthRequest,
    IChangePasswordRequest,
    IUpdateFullNameRequest,
    IUploadProfilePictureRequest,
} from "../types";
import { validationResult } from "express-validator";

class UserController {
    constructor(
        private userService: UserService,
        private credentialService: CredentialService,
    ) {}

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

    async uploadProfilePicture(
        req: IUploadProfilePictureRequest,
        res: Response,
        next: NextFunction,
    ) {
        const file = req.file;
        if (!file)
            return next(createHttpError(400, "Profile picture not found!"));

        const userId = req.auth.userId;
        try {
            const user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));

            const uploadFileResponse = await this.userService.uploadFile(
                file.path,
            );

            user.avatar = uploadFileResponse.url;

            await this.userService.saveUser(user);
            return res.json({
                user,
                message: "User profile picture updated successfully.",
            });
        } catch (error) {
            return next(error);
        }
    }

    async changePassword(
        req: IChangePasswordRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }
        const userId = req.auth.userId;
        const { newPassword, oldPassword } = req.body;

        let user;
        try {
            user = await this.userService.findUserByIdWithPassword(
                Number(userId),
            );
            if (!user) return next(createHttpError(400, "User not found!"));

            const hashPassword = user.password;
            const isMatch = await this.credentialService.hashCompare(
                oldPassword,
                hashPassword,
            );
            if (!isMatch)
                return next(
                    createHttpError(400, "Old password entered wrong!"),
                );
        } catch (error) {
            return next(error);
        }

        try {
            const newHashPassword =
                await this.credentialService.hashDataUsingBcrypt(newPassword);

            user.password = newHashPassword;
            await this.userService.saveUser(user);
            res.json({
                status: "OK",
                message: "User password changed successfully",
            });
        } catch (error) {
            return next(error);
        }
    }
}

export default UserController;
