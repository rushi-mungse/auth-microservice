import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import createJwtMock from "mock-jwks";
import { Role } from "../../src/constants";
import { User } from "../../src/entity";

describe("[DELETE] /api/user", () => {
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

            const deleteUserResponse = await request(app)
                .delete(`/api/user`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(deleteUserResponse.statusCode).toBe(200);
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

            const deleteUserResponse = await request(app)
                .delete(`/api/user`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(
                (deleteUserResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should check persist user in database", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                role: Role.CUSTOMER,
                password: "secret@password",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: "1",
                role: Role.CUSTOMER,
            });

            await request(app)
                .delete(`/api/user`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            const usersRepository = connection.getRepository(User);
            const users = await usersRepository.find();

            expect(users).toHaveLength(0);
        });

        it("should returns the deleted user id", async () => {
            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                role: Role.CUSTOMER,
                password: "secret@password",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(userData);

            const accessToken = jwt.token({
                userId: 1,
                role: Role.CUSTOMER,
            });

            const deleteUserResponse = await request(app)
                .delete(`/api/user`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(deleteUserResponse.body).toHaveProperty("user");
        });
    });

    describe("Missing some fields", () => {
        it("should returns 404 status code if user not found", async () => {
            const accessToken = jwt.token({
                sub: "1",
                role: Role.ADMIN,
            });

            const deleteUserResponse = await request(app)
                .delete(`/api/user/2`)
                .set("Cookie", [`accessToken=${accessToken}`]);

            expect(deleteUserResponse.statusCode).toBe(400);
        });
    });
});
