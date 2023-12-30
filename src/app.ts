import "reflect-metadata";
import express from "express";
import { errorHandlerMiddleware } from "./middlewares";
import { authRouter, userRouter } from "./routes";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const corsOption: cors.CorsOptions = {
    origin: ["http://localhost:5173"],
    credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use(errorHandlerMiddleware);

export default app;
