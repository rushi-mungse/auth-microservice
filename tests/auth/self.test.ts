import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import app from "../../src/app";
import { getTokens } from "../utils";
import createJWKSMock from "mock-jwks";
import { Role } from "../../src/constants";

describe("POST:auth/register/verify-otp", () => {
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

            // arrage
            const accessToken = jwt.token({
                userId: 1,
                role: Role.CUSTOMER,
            });

            // act
            const selfResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(selfResponse.statusCode).toBe(200);
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
            const selfResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(
                (selfResponse.headers as Record<string, string>)[
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
            const selfResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=does-not-pass-access-token`]);

            // assert
            expect(selfResponse.statusCode).toBe(401);
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

            // arrage
            const accessToken = jwt.token({
                userId: 1,
                role: Role.CUSTOMER,
            });

            // act
            const selfResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(selfResponse.body).toHaveProperty("id");
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

            // arrage
            const accessToken = jwt.token({
                userId: 1,
                role: Role.CUSTOMER,
            });

            // act
            const selfResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(selfResponse.body).toHaveProperty("id");
        });

        it("should return 400 status code if user not found", async () => {
            // arrage
            const accessToken = jwt.token({
                userId: 3,
                role: Role.CUSTOMER,
            });
            // act
            const selfResponse = await request(app)
                .get("/api/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(selfResponse.statusCode).toBe(400);
        });
    });
});
