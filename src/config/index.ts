import dotenv from "dotenv";
dotenv.config();

export const {
    PORT,
    NODE_ENV,
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_PORT,
    DB_NAME,
} = process.env;

export { default as logger } from "./logger";
export { default as AppDataSource } from "./data-source";
