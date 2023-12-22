import { Repository } from "typeorm";
import { sign } from "jsonwebtoken";
import { TPayload } from "../types";
import { Token, User } from "../entity";
import { PRIVATE_KEY, REFRESH_TOKEN_SECRET } from "../config";
import createHttpError from "http-errors";

class TokenService {
    constructor(private tokenRepository: Repository<Token>) {}

    signAccessToken(payload: TPayload) {
        if (!PRIVATE_KEY) {
            throw createHttpError(500, "SECRET_KEY is not found!");
        }

        const accessToken = sign(payload, PRIVATE_KEY, {
            algorithm: "RS256",
            expiresIn: "24h",
            issuer: "auth-service",
        });

        return accessToken;
    }

    signRefreshToken(payload: TPayload) {
        if (!REFRESH_TOKEN_SECRET) {
            throw createHttpError(500, "TOKEN_SECRET is not found!");
        }

        const refreshToken = sign(payload, REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: "auth-service",
            jwtid: String(payload.id),
        });

        return refreshToken;
    }

    async saveRefreshToken(userData: User) {
        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
        const expiresAt = new Date(Date.now() + MS_IN_YEAR);
        return await this.tokenRepository.save({ user: userData, expiresAt });
    }

    async deleteToken(tokenId: number) {
        await this.tokenRepository.delete(tokenId);
    }
}

export default TokenService;
