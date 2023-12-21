import bcrypt from "bcrypt";
import crypto from "crypto";
import createHttpError from "http-errors";
import { HASH_SECRET } from "../config";

export default class CredentialService {
    async hashDataUsingBcrypt(data: string) {
        const saltOrRound = 10;
        return await bcrypt.hash(data, saltOrRound);
    }

    async hashCompare(data: string, hashData: string) {
        return await bcrypt.compare(data, hashData);
    }

    hashDataUsingCrypto(data: string) {
        if (!HASH_SECRET)
            throw createHttpError(500, "HASH_SECRET is not found!");
        return crypto
            .createHmac("sha256", HASH_SECRET)
            .update(data)
            .digest("hex");
    }

    generateOtp() {
        return crypto.randomInt(1000, 9999);
    }
}
