import request from "supertest";
import app from "../../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../../src/config";
import createJwtMock from "mock-jwks";
import { Role } from "../../../src/constants";
import { User } from "../../../src/entity";

describe("[POST] /api/user/verify-otp-for-set-new-phone-number", () => {
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
        it("should returns the 200 status code if all ok", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(sendOtpForSetNewPhoneNumberResponse.body.otpInfo);

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(200);
        });

        it("should returns the json data", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(sendOtpForSetNewPhoneNumberResponse.body.otpInfo);

            expect(
                (
                    verifyOtpForSetNewPhoneNumberResponse.headers as Record<
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
                phoneNumber: "1234567890",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "91" });

            const wrongAccessToken = jwt.token({
                userId: "2",
                role: Role.CUSTOMER,
            });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${wrongAccessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should return status code 408 if otp expired", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                    hashOtp: `fsfswrwerw#${Date.now() - 1000 * 60 * 11}`,
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(408);
        });

        it("should return status code 400 if otp is invalid", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                    otp: "0299",
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should return json data with user", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567890", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.body).toHaveProperty(
                "user",
            );
        });

        it("should user phone number persist in database", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                });

            const users = await userRepository.find();
            expect(users[0].phoneNumber).toEqual("1234567809");
        });
    });

    describe("some fields are missing", () => {
        it("should return 400 status code if phone number is missing", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                    phoneNumber: "",
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if hashOtp is missing", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                    hashOtp: "",
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(400);
        });

        it("should return 400 status code if otp is missing", async () => {
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

            const sendOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/send-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ phoneNumber: "1234567809", countryCode: "91" });

            const verifyOtpForSetNewPhoneNumberResponse = await request(app)
                .post("/api/user/verify-otp-for-set-new-phone-number")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({
                    ...sendOtpForSetNewPhoneNumberResponse.body.otpInfo,
                    otp: "",
                });

            expect(verifyOtpForSetNewPhoneNumberResponse.statusCode).toBe(400);
        });
    });
});
