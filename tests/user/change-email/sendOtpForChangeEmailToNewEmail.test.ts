import request from "supertest";
import app from "../../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/config";
import createJwtMock from "mock-jwks";
import { Role } from "../../../src/constants";
import { User } from "../../../src/entity";

describe("[POST] /api/user/send-otp-to-new-email-for-email-change", () => {
    let connection: DataSource;
    let jwt: ReturnType<typeof createJwtMock>;

    beforeAll(async () => {
        jwt = createJwtMock("http://localhost:5001");
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

    describe("Given all fields", () => {
        it("should returns the 200 status code", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            const sendOtpForChangeEmailResponse = await request(app)
                .post("/api/user/send-otp-to-new-email-for-email-change")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ email: "new.doe@gmail.com" });

            expect(sendOtpForChangeEmailResponse.statusCode).toBe(200);
        });

        it("should returns the json data", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            const sendOtpForChangeEmailResponse = await request(app)
                .post("/api/user/send-otp-to-new-email-for-email-change")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ email: "new.doe@gmail.com" });

            expect(
                (
                    sendOtpForChangeEmailResponse.headers as Record<
                        string,
                        string
                    >
                )["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should returns the 400 status code if user not found", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "2",
                role: Role.CUSTOMER,
            });

            const sendOtpForChangeEmailResponse = await request(app)
                .post("/api/user/send-otp-to-new-email-for-email-change")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ email: "new.doe@gmail.com" });

            expect(sendOtpForChangeEmailResponse.statusCode).toBe(400);
        });

        it("should returns the 400 status code if email is already registered", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            const sendOtpForChangeEmailResponse = await request(app)
                .post("/api/user/send-otp-to-new-email-for-email-change")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ email: "jon.doe@gmail.com" });

            expect(sendOtpForChangeEmailResponse.statusCode).toBe(400);
        });

        it("should return json data with otpInfo", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            const sendOtpForChangeEmailResponse = await request(app)
                .post("/api/user/send-otp-to-new-email-for-email-change")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ email: "new.doe@gmail.com" });

            expect(sendOtpForChangeEmailResponse.body).toHaveProperty(
                "otpInfo",
            );
        });
    });

    describe("Some fields are missing", () => {
        it("should return 400 status code if email is missing", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            const sendOtpForChangeEmailResponse = await request(app)
                .post("/api/user/send-otp-to-new-email-for-email-change")
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(sendOtpForChangeEmailResponse.statusCode).toBe(400);
        });
    });
});
