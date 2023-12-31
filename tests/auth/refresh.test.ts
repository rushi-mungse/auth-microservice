import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { Role } from "../../src/constants";
import { Token } from "../../src/entity";
import { TokenService } from "../../src/services";

describe("[GET] auth/refresh", () => {
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

            const tokenRepository = connection.getRepository(Token);
            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.CUSTOMER,
                tokenId: "1",
            });

            // act
            const refreshResponse = await request(app)
                .get("/api/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`]);

            // assert
            expect(refreshResponse.statusCode).toBe(200);
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

            // act
            const refreshResponse = await request(app)
                .get("/api/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`]);

            // assert
            expect(
                (refreshResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 401 status code if user is unauthorized", async () => {
            // act
            const refreshResponse = await request(app)
                .get("/api/auth/refresh")
                .set("Cookie", [`refreshToken=does-not-pass-access-token`]);

            // assert
            expect(refreshResponse.statusCode).toBe(401);
        });

        it("should return user data with id", async () => {
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

            const tokenRepository = connection.getRepository(Token);
            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.CUSTOMER,
                tokenId: "1",
            });

            // act
            const refreshResponse = await request(app)
                .get("/api/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`]);

            // assert
            expect(refreshResponse.body).toHaveProperty("id");
        });
    });
});
