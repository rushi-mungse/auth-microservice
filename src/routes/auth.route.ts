import express, {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";
import { AuthController } from "../controllers";
import { sendOtpDataValidator, verifyOtpDataValidator } from "../validators";
import { AppDataSource, logger } from "../config";
import { Token, User } from "../entity";
import { CredentialService, TokenService, UserService } from "../services";
const router = express.Router();

/* Dependancy Injection */
const userRepository = AppDataSource.getRepository(User);
const tokenRepository = AppDataSource.getRepository(Token);

const userService = new UserService(userRepository);
const tokenService = new TokenService(tokenRepository);

const credentialService = new CredentialService();
const authController = new AuthController(
    userService,
    logger,
    credentialService,
    tokenService,
);

router.post(
    "/register/send-otp",
    sendOtpDataValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.sendOtp(req, res, next) as unknown as RequestHandler,
);

router.post(
    "/register/verify-otp",
    verifyOtpDataValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.verifyOtp(req, res, next) as unknown as RequestHandler,
);

export default router;
