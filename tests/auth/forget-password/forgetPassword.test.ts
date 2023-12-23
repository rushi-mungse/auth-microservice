import request from "supertest";
import app from "../../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/config";

describe("POST /api/auth/forget-password", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection?.destroy();
    });

    const sendOtpData = {
        fullName: "Rushikesh Mungse",
        email: "mungse.rushi@gmail.com",
        password: "rushi@495",
        confirmPassword: "rushi@495",
    };

    const forgetPasswordData = {
        email: "mungse.rushi@gmail.com",
    };

    describe("Given all fields", () => {
        it("should returns the 200 status code", async () => {
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const forgetPasswordResponse = await request(app)
                .post("/api/auth/forget-password")
                .send(forgetPasswordData);

            expect(forgetPasswordResponse.statusCode).toBe(200);
        });

        it("should returns json response", async () => {
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const forgetPasswordResponse = await request(app)
                .post("/api/auth/forget-password")
                .send(forgetPasswordData);

            expect(
                (forgetPasswordResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 status code if email is not registered", async () => {
            const forgetPasswordResponse = await request(app)
                .post("/api/auth/forget-password")
                .send(forgetPasswordData);

            expect(forgetPasswordResponse.statusCode).toBe(400);
        });

        it("should return hashOtp", async () => {
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const forgetPasswordResponse = await request(app)
                .post("/api/auth/forget-password")
                .send(forgetPasswordData);

            expect(forgetPasswordResponse.body).toHaveProperty("hashOtp");
        });
    });

    describe("Some fields are missing", () => {
        it("should return 400 status code if email is missing", async () => {
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const forgetPasswordResponse = await request(app)
                .post("/api/auth/forget-password")
                .send();

            expect(forgetPasswordResponse.statusCode).toBe(400);
        });
    });
});
