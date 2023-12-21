import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/config";
import app from "../../../src/app";
import { User } from "../../../src/entity";
import { Role } from "./../../../src/constants";

describe("POST:auth/register/send-otp", () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("all fields are given", () => {
        it("should return 200 status code if all ok", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(200);
        });

        it("should return json data", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(
                (sendOtpResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 status code if email already registered", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...sendOtpData, role: Role.CUSTOMER });

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if password and confirm password does not match", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "doesnotmatch",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });

        it("should return json with hashOtp, email and fullName", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            expect(sendOtpResponse.body).toHaveProperty("hashOtp");
            expect(sendOtpResponse.body).toHaveProperty("email");
            expect(sendOtpResponse.body).toHaveProperty("fullName");
        });

        it("should return 400 status code if password length is less than 8 chars", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret",
                confirmPassword: "secret",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(sendOtpResponse.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });

    describe("some fields are missing", () => {
        it("should return 400 status code if fullName is missing", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if email is missing", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if password is missing", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                confirmPassword: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if confirm password is missing", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if email is not valid email", async () => {
            /**
             *  --- arrage ---
             */
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            /**
             * --- act ---
             */
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            /**
             * --- assert ---
             */
            expect(sendOtpResponse.statusCode).toBe(400);
        });
    });
});
