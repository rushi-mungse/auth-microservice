import request from "supertest";
import app from "../../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/config";
import createJwtMock from "mock-jwks";
import { Role } from "../../../src/constants";
import { User } from "../../../src/entity";

describe("[POST] /api/user/send-otp-for-set-new-phone-number", () => {
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
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.statusCode).toBe(200);
        });

        it("should returns the json data", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            // assert
            expect(
                (
                    sendOtpForChangeOldPhoneNumberResponse.headers as Record<
                        string,
                        string
                    >
                )["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should returns the 400 status code if user not found", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "2",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should returns the json data with otpInfo", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.body).toHaveProperty(
                "otpInfo",
            );
        });
    });

    describe("Some fields are missing", () => {
        it("should returns 400 status code if phone number missing", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "", countryCode: "91" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should returns 400 status code if country code missing", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should returns 400 status code if phone number not 10 digits", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "123456790", countryCode: "91" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should returns 400 status code if country code not 2 digits", async () => {
            // arrange
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            // act
            const sendOtpForChangeOldPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "9" });

            // assert
            expect(sendOtpForChangeOldPhoneNumberResponse.statusCode).toBe(400);
        });
    });
});
