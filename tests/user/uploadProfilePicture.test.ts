import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config";
import createJwtMock from "mock-jwks";
import { Role } from "../../src/constants";
import { User } from "../../src/entity";
import path from "path";
const TIMEOUT_INTERVAL = 10000;

describe.skip("[POST] /api/user/upload-profile-picture", () => {
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
        it(
            "should returns the 200 status code",
            async () => {
                // arrange
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
                const testPathfile = path.resolve(
                    __dirname,
                    "../utils/img/test.jpg",
                );

                // act
                const uploadProfilePictureResponse = await request(app)
                    .post(`/api/user/upload-profile-picture`)
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .attach("avatar", testPathfile);

                // assert
                expect(uploadProfilePictureResponse.statusCode).toBe(200);
            },
            TIMEOUT_INTERVAL,
        );

        it(
            "should returns the json data",
            async () => {
                // arrange
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
                const testPathfile = path.resolve(
                    __dirname,
                    "../utils/img/test.jpg",
                );

                // act
                const uploadProfilePictureResponse = await request(app)
                    .post(`/api/user/upload-profile-picture`)
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .attach("avatar", testPathfile);

                expect(
                    (
                        uploadProfilePictureResponse.headers as Record<
                            string,
                            string
                        >
                    )["content-type"],
                ).toEqual(expect.stringContaining("json"));
            },
            TIMEOUT_INTERVAL,
        );

        it("should returns the 400 status code if user not found", async () => {
            // arrange
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

            const testPathfile = path.resolve(
                __dirname,
                "../utils/img/test.jpg",
            );

            // act
            const uploadProfilePictureResponse = await request(app)
                .post(`/api/user/upload-profile-picture`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .attach("avatar", testPathfile);

            expect(uploadProfilePictureResponse.statusCode).toBe(400);
        });

        it(
            "should returns the json user data",
            async () => {
                // arrange
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

                const testPathfile = path.resolve(
                    __dirname,
                    "../utils/img/test.jpg",
                );

                // act
                const uploadProfilePictureResponse = await request(app)
                    .post(`/api/user/upload-profile-picture`)
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .attach("avatar", testPathfile);

                // assert
                expect(uploadProfilePictureResponse.body).toHaveProperty(
                    "user",
                );
            },
            TIMEOUT_INTERVAL,
        );

        it(
            "should returns the updated user avatar",
            async () => {
                // arrange
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

                const testPathfile = path.resolve(
                    __dirname,
                    "../utils/img/test.jpg",
                );

                // act
                const uploadProfilePictureResponse = await request(app)
                    .post(`/api/user/upload-profile-picture`)
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .attach("avatar", testPathfile);

                // assert
                expect(
                    uploadProfilePictureResponse.body.user.avatar,
                ).not.toBeNull();
            },
            TIMEOUT_INTERVAL,
        );

        it(
            "should user avatar persist in database",
            async () => {
                // arrange
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

                const testPathfile = path.resolve(
                    __dirname,
                    "../utils/img/test.jpg",
                );

                // act
                await request(app)
                    .post(`/api/user/upload-profile-picture`)
                    .set("Cookie", [`accessToken=${accessToken}`])
                    .attach("avatar", testPathfile);

                // assert
                const users = await userRepository.find();
                expect(users[0].avatar).not.toBeNull();
            },
            TIMEOUT_INTERVAL,
        );
    });

    describe("Missing some fields", () => {
        it(
            "should returns the 400 status code if file is missing",
            async () => {
                const accessToken = jwt.token({
                    userId: "1",
                    role: Role.CUSTOMER,
                });

                const uploadProfilePictureResponse = await request(app)
                    .post(`/api/user/upload-profile-picture`)
                    .set("Cookie", [`accessToken=${accessToken}`]);

                expect(uploadProfilePictureResponse.statusCode).toBe(400);
            },
            TIMEOUT_INTERVAL,
        );
    });
});
