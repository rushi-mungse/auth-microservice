import { NextFunction, Response, Request } from "express";
import { IAuthCookie } from "../types";
import { TokenService } from "../services";
import { AppDataSource } from "../config";
import createHttpError from "http-errors";
import { Token } from "../entity";

const tokenRepositoty = AppDataSource.getRepository(Token);
const tokenService = new TokenService(tokenRepositoty);

/* if  user is unauthorized then pass next */
export default function (req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.cookies as IAuthCookie;
    if (!refreshToken) return next();
    try {
        const token = tokenService.verifyRefreshToken(refreshToken);
        if (token) return next(createHttpError(400, "User already login!"));
        return next();
    } catch (error) {
        return next(createHttpError(500, "Internal Server Error!"));
    }
}
