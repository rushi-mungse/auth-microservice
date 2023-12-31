import { Request, Response, NextFunction } from "express";
import { CredentialService, UserService } from "../services";
import createHttpError from "http-errors";
import {
    IAuthRequest,
    IChangePasswordRequest,
    IUpdateFullNameRequest,
    IUploadProfilePictureRequest,
    ISendOtpForChangeEmailRequest,
    IVerifyOtpForChangeEmailRequest,
} from "../types";
import { validationResult } from "express-validator";
import { CHANGE_EMAIL_OTP_SECRET } from "../config";

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

            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

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

    async sendOtpForChangeEmail(
        req: ISendOtpForChangeEmailRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { email } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));

            if (user.email !== email)
                return next(createHttpError(400, "Email does not registered!"));
        } catch (error) {
            next(error);
        }

        /* generate otp and hash otp */
        try {
            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            // TODO: make notification webhook for send otp for user by email

            const prepareDataForHash = `${otp}.${email}.${expires}.${CHANGE_EMAIL_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}`;

            // FIXME: remove otp from res

            return res.json({
                otpInfo: { fullName: user?.fullName, email, hashOtp, otp },
                message: "Otp send successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtpForChangeEmail(
        req: IVerifyOtpForChangeEmailRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { email, fullName, hashOtp: hashData, otp } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));

            if (user.email !== email)
                return next(createHttpError(400, "Email does not registered!"));
        } catch (error) {
            return next(error);
        }

        try {
            const [hashOtp, expires] = hashData.split("#");
            if (Date.now() > +expires) {
                return next(
                    createHttpError(408, "Otp expired please resend otp!"),
                );
            }

            const prepareDataForHash = `${otp}.${email}.${expires}.${CHANGE_EMAIL_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            if (hashOtpData !== hashOtp)
                return next(createHttpError(400, "Otp is invalid!"));

            return res.json({
                isOtpVerified: true,
                message: "Otp verified successfuylly.",
            });
        } catch (error) {
            return next(error);
        }
    }
}

export default UserController;
