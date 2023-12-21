import { logger } from "../../src/config";

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
