import { config } from "dotenv";
import path from "path";

config({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV || "dev"}`),
});

export const {
    PORT,
    NODE_ENV,
    HASH_SECRET,
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_PORT,
    DB_NAME,
    PRIVATE_KEY,
    REFRESH_TOKEN_SECRET,
    JWKS_URI,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env;

export { default as logger } from "./logger";
export { default as AppDataSource } from "./data-source";
export { default as uploadOnCloudinary } from "./cloudinary";
