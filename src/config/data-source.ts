import "reflect-metadata";
import { DataSource } from "typeorm";
import { Token, User } from "../entity";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USERNAME } from "./";

export default new DataSource({
    type: "postgres",
    host: DB_HOST,
    port: Number(DB_PORT),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User, Token],
    migrations: [],
    subscribers: [],
});
