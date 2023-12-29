import express, {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";
import { UserController } from "../controllers";
import { checkAccessToken, permissionMiddleware } from "../middlewares";
import { UserService } from "../services";
import { AppDataSource } from "../config";
import { User } from "../entity";
import { Role } from "../constants";

const router = express.Router();

const userRespository = AppDataSource.getRepository(User);
const userService = new UserService(userRespository);
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
