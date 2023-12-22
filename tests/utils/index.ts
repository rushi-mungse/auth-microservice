import { logger } from "../../src/config";
import { IAuthCookie } from "../../src/types";

// to check jwt token is valid
export const isJWT = (token: string | null): boolean => {
    if (token === null) return false;
    const parts = token.split(".");

    if (parts.length !== 3) return false;

    try {
        parts.forEach((part) => {
            Buffer.from(part, "base64").toString("utf-8");
        });
        return true;
    } catch (error) {
        logger.error(error);
        return false;
    }
};

export const getTokens = (
    response: Response,
): { accessToken: string | null; refreshToken: string | null } => {
    var accessToken: string | null = null;
    let refreshToken: string | null = null;

    const cookies =
        (response.headers as Record<string, any>)["set-cookie"] || [];

    cookies.forEach((cookie: string) => {
        if (cookie.startsWith("accessToken"))
            accessToken = cookie.split(";")[0].split("=")[1];

        if (cookie.startsWith("refreshToken"))
            refreshToken = cookie.split(";")[0].split("=")[1];
    });

    return { accessToken, refreshToken };
};
