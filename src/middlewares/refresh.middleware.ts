import { Request } from "express";
import { expressjwt } from "express-jwt";
import { IAuthCookie, TPayload } from "../types";
import { AppDataSource, logger, REFRESH_TOKEN_SECRET } from "../config";
import { Token } from "../entity";

/* validate refresh token and check if revoked refresh token */
export default expressjwt({
    secret: REFRESH_TOKEN_SECRET ?? "",
    algorithms: ["HS256"],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as IAuthCookie;
        return refreshToken;
    },
    async isRevoked(req: Request, token) {
        if (!token) return true;
        const payload = token.payload as TPayload;
        try {
            const tokenRepository = AppDataSource.getRepository(Token);
            const tokenRef = await tokenRepository.findOne({
                where: {
                    id: Number(payload.tokenId),
                    user: { id: Number(payload.userId) },
                },
            });
            return tokenRef === null;
        } catch (error) {
            logger.error("Error while getting the refresh token", {
                userId: payload.userId,
            });
        }
        return true;
    },
});
