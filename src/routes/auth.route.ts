import express from "express";
import { AuthController } from "../controllers";
const router = express.Router();

const authController = new AuthController();

router.post("/register/send-otp", (req, res, next) =>
    authController.sendOtp(req, res, next),
);

export default router;
