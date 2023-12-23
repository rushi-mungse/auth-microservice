import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import { Token } from "../../src/entity";
import { Role } from "../../src/constants";
import { TokenService } from "../../src/services";
import createJWKSMock from "mock-jwks";
import { getTokens, isJWT } from "../utils";

describe("POST /api/auth/login", () => {
    let connection: DataSource;
    let jwt: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwt = createJWKSMock("http://localhost:5001");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwt.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection?.destroy();
    });

    afterEach(() => {
        jwt.stop();
    });

    describe("all fields are given", () => {
        // arrange
        const sendOtpData = {
            fullName: "Jon Doe",
            email: "jon.doe@gmail.com",
            password: "secret@password",
            confirmPassword: "secret@password",
        };

        const loginData = {
            email: "jon.doe@gmail.com",
            password: "secret@password",
        };

        it("should returns the 200 status code if all ok", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            // assert
            expect(loginResponse.statusCode).toBe(200);
        });

        it("should returns json response", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            // assert
            expect(
                (loginResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 400 if user already login", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const tokenRepository = connection.getRepository(Token);
            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.CUSTOMER,
                tokenId: "1",
            });

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData)
                .set("Cookie", [`refreshToken=${refreshToken}`]);

            // assert
            expect(loginResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if user is not found", async () => {
            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);
            expect(loginResponse.statusCode).toBe(400);
        });

        it("should return user data", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            // assert
            expect(loginResponse.body).toHaveProperty("email");
            expect(loginResponse.body).toHaveProperty("id");
            expect(loginResponse.body).toHaveProperty("fullName");
        });

        it("should return 400 status code if password does not match", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "jon.doe@gmail.com",
                    password: "does-not-match",
                });

            // assert
            expect(loginResponse.statusCode).toBe(400);
        });

        it("should persist token in database", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            // arrage
            const accessToken = jwt.token({
                userId: 1,
                role: Role.CUSTOMER,
            });

            const tokenRepository = connection.getRepository(Token);
            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.CUSTOMER,
                tokenId: "1",
            });

            // act
            await request(app)
                .get("/api/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            await request(app).post("/api/auth/login").send(loginData);

            // assert
            const tokens = await tokenRepository.find();
            expect(tokens).toHaveLength(1);
        });

        it("should be set cookies if user login", async () => {
            // act
            const sendOtpResponse = await request(app)
                .post("/api/auth/register/send-otp")
                .send(sendOtpData);

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            // arrage
            const _accessToken = jwt.token({
                userId: 1,
                role: Role.CUSTOMER,
            });

            const tokenRepository = connection.getRepository(Token);
            const _refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.CUSTOMER,
                tokenId: "1",
            });

            // act
            await request(app)
                .get("/api/auth/logout")
                .set("Cookie", [
                    `accessToken=${_accessToken}`,
                    `refreshToken=${_refreshToken}`,
                ]);

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            const { accessToken, refreshToken } = getTokens(
                loginResponse as unknown as Response,
            );

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJWT(accessToken)).toBeTruthy();
            expect(isJWT(refreshToken)).toBeTruthy();
        });
    });

    describe("some fields are missing", () => {
        it("should return 400 status code if email is missing", async () => {
            const loginData = {
                email: "",
                password: "secret@password",
            };

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(loginResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if password is missing", async () => {
            const userData = {
                email: "jon.doe@gmail.com",
                password: "",
            };

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(userData);

            expect(loginResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if email is not valid email", async () => {
            const loginData = {
                email: "jon.doegmail.com",
                password: "secret@password",
            };

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(loginResponse.statusCode).toBe(400);
        });
    });
});
