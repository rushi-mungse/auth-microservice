import request from "supertest";
import app from "../../../src/app";

describe("POST:auth/register/send-otp", () => {
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
    });

    describe("some fields are missing", () => {});
});
