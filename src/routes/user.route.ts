import express, {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";
import { UserController } from "../controllers";
import {
    checkAccessToken,
    multerMiddleware,
    permissionMiddleware,
} from "../middlewares";
import { UserService } from "../services";
import { AppDataSource, uploadOnCloudinary } from "../config";
import { User } from "../entity";
import { Role } from "../constants";
import { IAuthRequest } from "../types";
import { updateFullNameDataValidator } from "../validators";
import { UploadApiResponse } from "cloudinary";

const router = express.Router();

const userRespository = AppDataSource.getRepository(User);
const userService = new UserService(userRespository, uploadOnCloudinary);
const userController = new UserController(userService);

router.get(
    "/:userId",
    [checkAccessToken, permissionMiddleware([Role.ADMIN])],
    (req: Request, res: Response, next: NextFunction) =>
        userController.getOne(req, res, next) as unknown as RequestHandler,
);

router.get(
    "/",
    [checkAccessToken, permissionMiddleware([Role.ADMIN])],
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAll(req, res, next) as unknown as RequestHandler,
);

router.delete(
    "/:userId",
    [checkAccessToken, permissionMiddleware([Role.ADMIN])],
    (req: Request, res: Response, next: NextFunction) =>
        userController.delete(req, res, next) as unknown as RequestHandler,
);

router.delete(
    "/",
    [checkAccessToken],
    (req: Request, res: Response, next: NextFunction) =>
        userController.deleteMySelf(
            req as IAuthRequest,
            res,
            next,
        ) as unknown as RequestHandler,
);

router.post(
    "/update-full-name",
    [
        updateFullNameDataValidator as unknown as RequestHandler,
        checkAccessToken,
    ],
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateFullName(
            req as IAuthRequest,
            res,
            next,
        ) as unknown as RequestHandler,
);

router.post(
    "/upload-profile-picture",
    [checkAccessToken, multerMiddleware.single("avatar")],
    (req: Request, res: Response, next: NextFunction) =>
        userController.uploadProfilePicture(
            req as IAuthRequest,
            res,
            next,
        ) as unknown as RequestHandler,
);

export default router;

/**
 * User End Points
 *      - get('/:id)
 *      - upload user photo
 *      - update user
 *      - change email
 *      - change phone number
 *      - get all users
 *      - delete user
 */
