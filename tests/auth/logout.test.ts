import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import app from "../../src/app";
import { getTokens } from "../utils";
import createJWKSMock from "mock-jwks";
import { Role } from "../../src/constants";
import { TokenService } from "../../src/services";
import { Token } from "../../src/entity";

describe("GET:auth/logout", () => {
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

    afterEach(() => {
        jwt.stop();
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

            await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

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
            const logoutResponse = await request(app)
                .get("/api/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(logoutResponse.statusCode).toBe(200);
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

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const { accessToken } = getTokens(
                verifyOtpResponse as unknown as Response,
            );

            // act
            const logoutResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(
                (logoutResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 401 status code if user is unauthorized", async () => {
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

            const verifyOtpResponse = await request(app)
                .post("/api/auth/register/verify-otp")
                .send(sendOtpResponse.body);

            const { accessToken } = getTokens(
                verifyOtpResponse as unknown as Response,
            );

            // act
            const logoutResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=does-not-pass-access-token`]);

            // assert
            expect(logoutResponse.statusCode).toBe(401);
        });

        it("should return user data null", async () => {
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
            const logoutResponse = await request(app)
                .get("/api/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(logoutResponse.body.user).toBeNull();
        });

        it("should persist token in database", async () => {
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

            // assert
            const tokens = await tokenRepository.find();
            expect(tokens).toHaveLength(0);
        });
    });
});
