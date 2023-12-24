import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { Role } from "../../src/constants";

describe("GET:auth/permission", () => {
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
                role: Role.ADMIN,
            });

            // act
            const permissionResponse = await request(app)
                .get("/api/auth/permission")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(permissionResponse.statusCode).toBe(200);
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

            const accessToken = jwt.token({
                userId: 1,
                role: Role.ADMIN,
            });

            // act
            const permissionResponse = await request(app)
                .get("/api/auth/permission")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(
                (permissionResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 401 status code if user is unauthorized", async () => {
            // act
            const permissionResponse = await request(app)
                .get("/api/auth/permission")
                .set("Cookie", [`accessToken=does-not-pass-access-token`]);

            // assert
            expect(permissionResponse.statusCode).toBe(401);
        });

        it("should return json data with admin permission", async () => {
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
                role: Role.ADMIN,
            });

            // act
            const permissionResponse = await request(app)
                .get("/api/auth/permission")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(permissionResponse.body.permission).toBeTruthy();
        });

        it("should return 403 status code if permission denied", async () => {
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
            const permissionResponse = await request(app)
                .get("/api/auth/permission")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(permissionResponse.statusCode).toBe(403);
        });

        it("should return 400 status code if user not found", async () => {
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
                userId: 3,
                role: Role.ADMIN,
            });

            // act
            const permissionResponse = await request(app)
                .get("/api/auth/permission")
                .set("Cookie", [`accessToken=${accessToken}`]);

            // assert
            expect(permissionResponse.statusCode).toBe(400);
        });
    });
});
