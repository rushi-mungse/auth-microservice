import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import createJwtMock from "mock-jwks";
import { Role } from "../../src/constants";
import { User } from "../../src/entity";

describe("POST /api/user/update-full-name", () => {
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ fullName: "Jenny Doe" });

            expect(updateFullNameResponse.statusCode).toBe(200);
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ fullName: "Jenny Doe" });

            expect(
                (updateFullNameResponse.headers as Record<string, string>)[
                    "content-type"
                ],
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ fullName: "Jenny Doe" });

            expect(updateFullNameResponse.statusCode).toBe(400);
        });

        it("should returns the json user data", async () => {
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ fullName: "Jenny Doe" });

            expect(updateFullNameResponse.body).toHaveProperty("user");
        });

        it("should returns the updated user fullName", async () => {
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ fullName: "Jenny Doe" });

            expect(updateFullNameResponse.body.user.fullName).toBe("Jenny Doe");
        });

        it("should persist user in database", async () => {
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ fullName: "Jenny Doe" });

            const users = await userRepository.find();
            expect(users[0].fullName).toBe("Jenny Doe");
        });
    });

    describe("Missing some fields", () => {
        it("should returns the 400 status code if fullName is missing", async () => {
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

            const updateFullNameResponse = await request(app)
                .post(`/api/user/update-full-name`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(updateFullNameResponse.statusCode).toBe(400);
        });
    });
});
