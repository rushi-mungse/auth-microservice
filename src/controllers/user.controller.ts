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
    ISendOtpForChangePhoneNumberRequest,
    IVerifyOtpForChangePhoneNumberRequest,
    ISendOtpToUserRegister,
    IVerifyOtpUserRegister,
} from "../types";

import { validationResult } from "express-validator";
import {
    CHANGE_EMAIL_OTP_SECRET,
    CHANGE_PHONE_NUMBER_OTP_SECRET,
} from "../config";

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

        try {
            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            const prepareDataForHash = `${otp}.${email}.${expires}.${CHANGE_EMAIL_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}`;

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
                message: "Otp verified successfully.",
            });
        } catch (error) {
            return next(error);
        }
    }

    async sendOtpForChangeEmailToNewEmail(
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

        try {
            const isExists = await this.userService.findUserByEmail(email);
            if (isExists)
                return next(
                    createHttpError(400, "This email is already registered!"),
                );
        } catch (error) {
            return next(error);
        }

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
        } catch (error) {
            next(error);
        }

        try {
            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            const prepareDataForHash = `${otp}.${email}.${expires}.${CHANGE_EMAIL_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}`;

            return res.json({
                otpInfo: { fullName: user?.fullName, email, hashOtp, otp },
                message: "Otp send successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtpForChangeEmailByNewEmail(
        req: IVerifyOtpForChangeEmailRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { email, hashOtp: hashData, otp } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
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
        } catch (error) {
            return next(error);
        }

        try {
            user.email = email;
            await this.userService.saveUser(user);
            return res.json({
                message: "User email changed successfully",
                isOtpVerified: true,
                user,
            });
        } catch (error) {
            return next(error);
        }
    }

    async sendOtpForChangeOldPhoneNumber(
        req: ISendOtpForChangePhoneNumberRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { phoneNumber, countryCode } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
            if (user.phoneNumber !== phoneNumber)
                return next(
                    createHttpError(400, "User phone number does not match!"),
                );
        } catch (error) {
            return next(error);
        }

        try {
            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            const prepareDataForHash = `${otp}.${phoneNumber}.${expires}.${CHANGE_PHONE_NUMBER_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}`;

            return res.json({
                otpInfo: {
                    fullName: user?.fullName,
                    phoneNumber,
                    hashOtp,
                    otp,
                    countryCode,
                },
                message: "Otp send successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtpForChangeOldPhoneNumber(
        req: IVerifyOtpForChangePhoneNumberRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { phoneNumber, hashOtp: hashData, otp } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));

            if (user.phoneNumber !== phoneNumber)
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

            const prepareDataForHash = `${otp}.${phoneNumber}.${expires}.${CHANGE_PHONE_NUMBER_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            if (hashOtpData !== hashOtp)
                return next(createHttpError(400, "Otp is invalid!"));

            return res.json({
                isOtpVerified: true,
                message: "Otp verified successfully.",
            });
        } catch (error) {
            return next(error);
        }
    }

    async sendOtpForSetNewPhoneNumber(
        req: ISendOtpForChangePhoneNumberRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { phoneNumber, countryCode } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
        } catch (error) {
            return next(error);
        }

        try {
            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            const prepareDataForHash = `${otp}.${phoneNumber}.${expires}.${CHANGE_PHONE_NUMBER_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}`;

            return res.json({
                otpInfo: {
                    fullName: user?.fullName,
                    phoneNumber,
                    hashOtp,
                    otp,
                    countryCode,
                },
                message: "Otp send successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtpForSetNewPhoneNumber(
        req: IVerifyOtpForChangePhoneNumberRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const userId = req.auth.userId;
        const { phoneNumber, hashOtp: hashData, otp } = req.body;

        let user;
        try {
            user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
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

            const prepareDataForHash = `${otp}.${phoneNumber}.${expires}.${CHANGE_PHONE_NUMBER_OTP_SECRET}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            if (hashOtpData !== hashOtp)
                return next(createHttpError(400, "Otp is invalid!"));
        } catch (error) {
            return next(error);
        }

        try {
            user.phoneNumber = phoneNumber;
            await this.userService.saveUser(user);
            return res.json({
                user,
                message: "User phone number changed successfully.",
            });
        } catch (error) {
            return next(error);
        }
    }

    async sendOtp(
        req: ISendOtpToUserRegister,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { fullName, email, password, confirmPassword, role } = req.body;

        if (password !== confirmPassword) {
            const err = createHttpError(
                400,
                "confirm password not match to password!",
            );
            return next(err);
        }

        try {
            const user = await this.userService.findUserByEmail(email);
            if (user) {
                return next(
                    createHttpError(400, "This email already registered!"),
                );
            }
        } catch (error) {
            return next(error);
        }

        try {
            const hashPassword =
                await this.credentialService.hashDataUsingBcrypt(password);

            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            const prepareDataForHash = `${otp}.${email}.${expires}.${hashPassword}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}#${hashPassword}`;

            return res.json({ fullName, email, hashOtp, otp, role });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtp(
        req: IVerifyOtpUserRegister,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { fullName, email, otp, hashOtp, role } = req.body;

        try {
            const user = await this.userService.findUserByEmail(email);
            if (user) {
                return next(
                    createHttpError(400, "This email already registered!"),
                );
            }
        } catch (error) {
            return next(error);
        }

        if (hashOtp.split("#").length !== 3) {
            const error = createHttpError(400, "Otp is invalid!");
            return next(error);
        }

        const [prevHashedOtp, expires, hashPassword] = hashOtp.split("#");
        try {
            if (Date.now() > +expires) {
                const error = createHttpError(408, "Otp is expired!");
                return next(error);
            }

            const prepareDataForHash = `${otp}.${email}.${expires}.${hashPassword}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            if (hashOtpData !== prevHashedOtp) {
                const error = createHttpError(400, "Otp is invalid!");
                return next(error);
            }
        } catch (error) {
            return next(error);
        }

        let user;
        try {
            user = await this.userService.saveUser({
                fullName,
                email,
                password: hashPassword,
                role,
            });
        } catch (error) {
            next(error);
        }

        if (!user) {
            return next(createHttpError(500, "Internal Server Error!"));
        }

        return res.json(user);
    }
}

export default UserController;
