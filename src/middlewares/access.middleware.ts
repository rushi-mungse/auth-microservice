import { Request } from "express";
import { GetVerificationKey, expressjwt } from "express-jwt";
import jwksClient from "jwks-rsa";
import { IAuthCookie } from "../types";
import { JWKS_URI } from "../config";

export default expressjwt({
    secret: jwksClient.expressJwtSecret({
        jwksUri: JWKS_URI ?? "",
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ["RS256"],
    getToken(req: Request) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(" ")[1] !== "undefined") {
            const accessToken = authHeader.split(" ")[1];
            if (accessToken) return accessToken;
        }
        const { accessToken } = req.cookies as IAuthCookie;
        return accessToken;
    },
});
