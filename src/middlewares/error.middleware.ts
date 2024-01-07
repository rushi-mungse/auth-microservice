import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { logger } from "../config";

export default function (
    err: HttpError,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    logger.error(err.message);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        error: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    });
}
