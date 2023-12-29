import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { Role } from "../../src/constants";
import { TokenService } from "../../src/services";
import { Token, User } from "../../src/entity";

describe("GET:user/get/:userId", () => {
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
            const tokenRepository = connection.getRepository(Token);
            const userRespository = connection.getRepository(User);

            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            await userRespository.save(userData as unknown as User);

            const accessToken = jwt.token({
                userId: "2",
                role: Role.ADMIN,
            });

            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "2",
                role: Role.ADMIN,
                tokenId: "1",
            });

            // act
            const getUserResponse = await request(app)
                .get("/api/user/1")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(getUserResponse.statusCode).toBe(200);
        });

        it("should return json data", async () => {
            // arrange
            const tokenRepository = connection.getRepository(Token);
            const userRespository = connection.getRepository(User);

            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            await userRespository.save(userData as unknown as User);

            const accessToken = jwt.token({
                userId: "2",
                role: Role.ADMIN,
            });

            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "2",
                role: Role.ADMIN,
                tokenId: "1",
            });

            // act
            const getUserResponse = await request(app)
                .get("/api/user/1")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(
                (getUserResponse.headers as Record<string, string>)[
                    "content-type"
                ],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should return 403 status code if user not admin", async () => {
            // arrange
            const tokenRepository = connection.getRepository(Token);
            const userRespository = connection.getRepository(User);

            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            await userRespository.save(userData as unknown as User);

            const accessToken = jwt.token({
                userId: "2",
                role: Role.CUSTOMER,
            });

            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "2",
                role: Role.CUSTOMER,
                tokenId: "1",
            });

            // act
            const getUserResponse = await request(app)
                .get("/api/user/2")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(getUserResponse.statusCode).toBe(403);
        });

        it("should return json user data", async () => {
            // arrange
            const tokenRepository = connection.getRepository(Token);
            const userRespository = connection.getRepository(User);

            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            await userRespository.save(userData as unknown as User);

            const accessToken = jwt.token({
                userId: 1,
                role: Role.ADMIN,
            });

            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.ADMIN,
                tokenId: "1",
            });

            // act
            const getUserResponse = await request(app)
                .get("/api/user/1")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(getUserResponse.body.user).toHaveProperty("id");
        });

        it("should return 400 status code if user not found", async () => {
            // arrange
            const tokenRepository = connection.getRepository(Token);
            const userRespository = connection.getRepository(User);

            const userData = {
                fullName: "Jon Doe",
                email: "jon.doe@gmail.com",
                password: "secret@password",
                role: Role.CUSTOMER,
            };

            await userRespository.save(userData as unknown as User);

            const accessToken = jwt.token({
                userId: 1,
                role: Role.ADMIN,
            });

            const refreshToken = new TokenService(
                tokenRepository,
            ).signRefreshToken({
                userId: "1",
                role: Role.ADMIN,
                tokenId: "1",
            });

            // act
            const getUserResponse = await request(app)
                .get("/api/user/2")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ]);

            // assert
            expect(getUserResponse.statusCode).toBe(400);
        });

        it("should returns the 400 status code if userId is incorrect", async () => {
            const adminToken = jwt.token({
                sub: "1",
                role: Role.ADMIN,
            });

            const getUserResponse = await request(app)
                .get(`/api/user/werwer`)
                .set("Cookie", [`accessToken=${adminToken}`]);

            expect(getUserResponse.statusCode).toBe(400);
        });
    });
});
