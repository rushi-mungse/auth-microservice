import "reflect-metadata";
import express from "express";
import { errorHandlerMiddleware } from "./middlewares";
import { authRouter } from "./routes";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());

app.use("/api/auth", authRouter);

app.use(errorHandlerMiddleware);

export default app;
