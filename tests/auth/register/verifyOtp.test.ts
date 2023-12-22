import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/config";
import app from "../../../src/app";
import { Token, User } from "../../../src/entity";
import { Role } from "./../../../src/constants";
import { IUserData } from "../../../src/types";
import { getTokens, isJWT } from "../../utils";

describe("POST:auth/register/verify-otp", () => {
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
            // arrange
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(200);
        });

        it("should return json data", async () => {
            // arrange
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            // assert
            expect(
                (verifyOtpResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 status code if email already registered", async () => {
            // arrange
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...sendOtpData, role: Role.CUSTOMER });

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 408 status code if otp expired", async () => {
            // arrange
            const expires = Date.now() - 1000 * 60 * 10;
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                hashOtp: `1552c4883dd6faa52d5bb20d0b3d47c0d6c6282d6ba9d22b67661c15e354895a#${expires}#$2b$10$gyhcxaGe03TERr8JpvDX/uXEUCuwRc9Mxo6iBBy8IL0ov8Gt8gmWW`,
                otp: "1111",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(408);
        });

        it("should return json with user data", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            expect(verifyOtpResponse.body).toHaveProperty("id");
            expect(verifyOtpResponse.body).toHaveProperty("fullName");
            expect(verifyOtpResponse.body).toHaveProperty("email");
        });

        it("should user is persist in database", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(verifyOtpResponse.statusCode).toBe(200);
            expect(users).toHaveLength(1);
        });

        it("should customer is default role of user", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            expect((verifyOtpResponse.body as IUserData).role).toBe(
                Role.CUSTOMER,
            );
        });

        it("should be persist token in database", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const tokenRepository = connection.getRepository(Token);
            const tokens = await tokenRepository.find();

            expect(tokens).toHaveLength(1);
        });

        it("should be set cookies if user registered", async () => {
            const sendOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                confirmPassword: "secret@password",
            };

            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const { accessToken, refreshToken } = getTokens(
                verifyOtpResponse as unknown as Response,
            );

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJWT(accessToken)).toBeTruthy();
            expect(isJWT(refreshToken)).toBeTruthy();
        });

        it("should return 400 status code if hashOtp is invalid", async () => {
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                hashOtp: "secret@password",
                otp: "1111",
            };

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if hashOtp is invalid", async () => {
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                hashOtp: `1552c4883dd6faa52d5bb20d0b3d47c0d6c6282d6ba9d22b67661c15e354895a#${
                    Date.now() + 1000 * 60 * 10
                }#$2b$10$gyhcxaGe03TERr8JpvDX/uXEUCuwRc9Mxo6iBBy8IL0ov8Gt8gmWW`,
                otp: "1111",
            };

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            expect(verifyOtpResponse.statusCode).toBe(400);
        });
    });

    describe("some fields are missing", () => {
        it("should return 400 status code if fullName is missing", async () => {
            // arrange
            const verifyOtpData = {
                email: "jon.doe@gmail.com",
                hashOtp: "hashed-otp-here",
                otp: "1111",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if email is missing", async () => {
            // arrange
            const verifyOtpData = {
                fullName: "Jon Doe",
                hashOtp: "hashed-otp-here",
                otp: "1111",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if hashOtp is missing", async () => {
            // arrange
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                otp: "1111",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if confirm otp is missing", async () => {
            // arrange
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                hashOtp: "hash-otp-here",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if email is not valid email", async () => {
            // arrange
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doegmail.com",
                hashOtp: "hash-otp-here",
                otp: "1111",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if otp is not valid otp", async () => {
            // arrange
            const verifyOtpData = {
                fullName: "Jon Doe",
                email: "jon.doegmail.com",
                hashOtp: "hash-otp-here",
                otp: "111",
            };

            // act
            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(verifyOtpData);

            // assert
            expect(verifyOtpResponse.statusCode).toBe(400);
        });
    });
});
