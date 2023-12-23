import { User } from "../entity";
import { Repository } from "typeorm";
import { IUserData } from "../types";
import createHttpError from "http-errors";

class UserService {
    constructor(private userRepository: Repository<User>) {}

    /* find user by email */
    async findUserByEmail(email: string) {
        return await this.userRepository.findOne({
            where: { email },
            select: [
                "id",
                "fullName",
                "email",
                "phoneNumber",
                "role",
                "avatar",
            ],
        });
    }

    /* create user */
    async saveUser(userData: IUserData) {
        return await this.userRepository.save(userData);
    }

    async findUserById(userId: number) {
        return await this.userRepository.findOne({
            where: { id: userId },
            select: [
                "id",
                "fullName",
                "email",
                "avatar",
                "phoneNumber",
                "role",
            ],
        });
    }

    async findUserByEmailWithPassword(email: string) {
        return await this.userRepository.findOne({
            where: { email },
            select: [
                "id",
                "fullName",
                "email",
                "phoneNumber",
                "role",
                "avatar",
                "password",
            ],
        });
    }

    async updateUserPassword(userId: number, hashPassword: string) {
        await this.userRepository.update(userId, {
            password: hashPassword,
        });
    }
}

export default UserService;
