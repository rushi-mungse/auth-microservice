import { NextFunction, Request, Response } from "express";
import { IAuthRequest } from "../types";
import createHttpError from "http-errors";

export default (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const _req = req as IAuthRequest;
        const roleFromToken = _req.auth.role;

        if (!roles.includes(roleFromToken)) {
            const error = createHttpError(
                403,
                "You don't have enough permissions",
            );
            return next(error);
        }
        next();
    };
};
