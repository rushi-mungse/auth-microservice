import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { CredentialService, TokenService, UserService } from "../services";
import {
    IAuthRequest,
    IForgetPasswordRequest,
    ILoginRequest,
    ISendOtpRequestData,
    ISetPasswordRequest,
    IVerifyOtpRequestData,
    TPayload,
} from "../types";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { Role } from "../constants";

class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private credentialService: CredentialService,
        private tokenService: TokenService,
    ) {}

    async sendOtp(req: ISendOtpRequestData, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { fullName, email, password, confirmPassword } = req.body;

        this.logger.info({
            fullName,
            email,
            passowrd: null,
            confirmPassword: null,
        });

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

            return res.json({ fullName, email, hashOtp, otp });
        } catch (error) {
            next(error);
        }
    }

    async verifyOtp(
        req: IVerifyOtpRequestData,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { fullName, email, otp, hashOtp } = req.body;

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
                role: Role.CUSTOMER,
            });
        } catch (error) {
            next(error);
        }

        if (!user) {
            return next(createHttpError(500, "Internal Server Error!"));
        }

        try {
            const payload: TPayload = {
                userId: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.signAccessToken(payload);
            const tokenRef = await this.tokenService.saveRefreshToken(user);
            const refreshToken = this.tokenService.signRefreshToken({
                ...payload,
                tokenId: String(tokenRef.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24,
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 * 365,
            });
        } catch (error) {
            return next(error);
        }

        return res.json(user);
    }

    async self(req: IAuthRequest, res: Response, next: NextFunction) {
        const userId = req.auth.userId;
        try {
            const user = await this.userService.findUserById(Number(userId));
            if (!user) return next(createHttpError(400, "User not found!"));
            res.json(user);
        } catch (error) {
            next(error);
        }
    }

    async logout(req: IAuthRequest, res: Response, next: NextFunction) {
        const tokenId = Number(req.auth.tokenId);
        try {
            await this.tokenService.deleteToken(Number(tokenId));
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.json({
                user: null,
                message: "User successfully logout.",
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: ILoginRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { email, password } = req.body;
        let user;
        try {
            user = await this.userService.findUserByEmailWithPassword(email);
            if (!user) {
                return next(
                    createHttpError(400, "Email or Password does not match!"),
                );
            }
        } catch (error) {
            return next(error);
        }
        try {
            const isMatch = await this.credentialService.hashCompare(
                password,
                user.password,
            );

            if (!isMatch)
                return next(
                    createHttpError(400, "Email or Password does not match!"),
                );
        } catch (error) {
            return next(error);
        }

        try {
            const payload: TPayload = {
                userId: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.signAccessToken(payload);
            const tokenRef = await this.tokenService.saveRefreshToken(user);
            const refreshToken = this.tokenService.signRefreshToken({
                ...payload,
                tokenId: String(tokenRef.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24,
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 * 365,
            });
        } catch (error) {
            return next(error);
        }

        return res.json({ ...user, password: null });
    }

    async refresh(req: IAuthRequest, res: Response, next: NextFunction) {
        const auth = req.auth;
        let user;
        try {
            user = await this.userService.findUserById(Number(auth.userId));
            if (!user) return next(createHttpError(400, "User not found!"));
        } catch (error) {
            return next(error);
        }

        try {
            await this.tokenService.deleteToken(Number(auth.tokenId));
        } catch (error) {
            return next(error);
        }

        try {
            const payload: TPayload = {
                userId: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.signAccessToken(payload);
            const tokenRef = await this.tokenService.saveRefreshToken(user);
            const refreshToken = this.tokenService.signRefreshToken({
                ...payload,
                tokenId: String(tokenRef.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24,
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 * 365,
            });
        } catch (error) {
            return next(error);
        }

        return res.json({ ...user, password: null });
    }

    async forgetPassword(
        req: IForgetPasswordRequest,
        res: Response,
        next: NextFunction,
    ) {
        const { email } = req.body;
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        let user;
        try {
            user = await this.userService.findUserByEmail(email);
            if (!user) {
                return next(
                    createHttpError(400, "This email is not registered!"),
                );
            }
        } catch (error) {
            return next(error);
        }

        try {
            const ttl = 1000 * 60 * 10;
            const expires = Date.now() + ttl;
            const otp = this.credentialService.generateOtp();

            const prepareDataForHash = `${otp}.${email}.${expires}`;
            const hashOtpData =
                this.credentialService.hashDataUsingCrypto(prepareDataForHash);

            const hashOtp = `${hashOtpData}#${expires}`;

            return res.json({ fullName: user.fullName, email, hashOtp, otp });
        } catch (error) {
            next(error);
        }
    }

    async setPassword(
        req: ISetPasswordRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { email, hashOtp, otp, password, confirmPassword, fullName } =
            req.body;

        if (password !== confirmPassword) {
            const err = createHttpError(
                400,
                "confirm password not match to password!",
            );
            return next(err);
        }

        let user;
        try {
            user = await this.userService.findUserByEmail(email);
            if (!user) {
                return next(
                    createHttpError(400, "This email is not registered!"),
                );
            }
        } catch (error) {
            return next(error);
        }

        if (hashOtp.split("#").length !== 2) {
            const error = createHttpError(400, "Otp is invalid!");
            return next(error);
        }

        const [prevHashedOtp, expires] = hashOtp.split("#");

        try {
            if (Date.now() > +expires) {
                const error = createHttpError(408, "Otp is expired!");
                return next(error);
            }

            const data = `${otp}.${email}.${expires}`;
            const hashData = this.credentialService.hashDataUsingCrypto(data);

            if (hashData !== prevHashedOtp) {
                const error = createHttpError(400, "Otp is invalid!");
                return next(error);
            }
        } catch (error) {
            return next(error);
        }

        try {
            const hashPassword =
                await this.credentialService.hashDataUsingBcrypt(password);
            await this.userService.updateUserPassword(user.id, hashPassword);
            res.json(user);
        } catch (error) {
            return next(error);
        }
    }

    async permission(req: IAuthRequest, res: Response, next: NextFunction) {
        const auth = req.auth;
        try {
            const user = await this.userService.findUserById(
                Number(auth.userId),
            );
            if (!user) return next(createHttpError(400, "User not found!"));
            return res.json({ permission: true, user });
        } catch (error) {
            return next(error);
        }
    }
}

export default AuthController;
